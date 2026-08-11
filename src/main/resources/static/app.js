'use strict';

const API_URL = '/api/tickets';
const formulario = document.getElementById('ticketForm');
const cuerpoTabla = document.getElementById('ticketsBody');
const guardarBtn = document.getElementById('guardarBtn');

const prioridades = {
    BAJA: { texto: 'Baja', clase: 'text-bg-success' },
    MEDIA: { texto: 'Media', clase: 'text-bg-warning' },
    ALTA: { texto: 'Alta', clase: 'text-bg-danger' }
};

document.addEventListener('DOMContentLoaded', cargarTickets);
formulario.addEventListener('submit', crearTicket);
document.getElementById('actualizarBtn').addEventListener('click', cargarTickets);

async function crearTicket(evento) {
    evento.preventDefault();

    const ticket = {
        solicitante: document.getElementById('solicitante').value.trim(),
        area: document.getElementById('area').value.trim(),
        asunto: document.getElementById('asunto').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        prioridad: document.getElementById('prioridad').value,
        estado: 'PENDIENTE'
    };

    cambiarEstadoBotonGuardar(true);

    try {
        await solicitar(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticket)
        });

        formulario.reset();
        mostrarAlerta('Ticket guardado correctamente.', 'success');
        await cargarTickets();
    } catch (error) {
        mostrarAlerta(error.message, 'danger');
    } finally {
        cambiarEstadoBotonGuardar(false);
    }
}

async function cargarTickets() {
    mostrarMensajeTabla('Cargando tickets...', 'text-secondary');

    try {
        const tickets = await solicitar(API_URL);
        pintarTickets(tickets);
    } catch (error) {
        mostrarMensajeTabla(error.message, 'text-danger');
        mostrarAlerta(error.message, 'danger');
    }
}

async function actualizarEstado(id, nuevoEstado, selector) {
    selector.disabled = true;

    try {
        await solicitar(`${API_URL}/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoEstado)
        });
        mostrarAlerta('Estado actualizado correctamente.', 'success');
    } catch (error) {
        mostrarAlerta(error.message, 'danger');
        await cargarTickets();
    } finally {
        selector.disabled = false;
    }
}

async function eliminarTicket(id) {
    if (!window.confirm(`¿Deseas eliminar el ticket #${id}?`)) return;

    try {
        await solicitar(`${API_URL}/${id}`, { method: 'DELETE' });
        mostrarAlerta('Ticket eliminado correctamente.', 'success');
        await cargarTickets();
    } catch (error) {
        mostrarAlerta(error.message, 'danger');
    }
}

async function solicitar(url, opciones = {}) {
    const respuesta = await fetch(url, opciones);

    if (!respuesta.ok) {
        let detalle = '';
        try {
            const error = await respuesta.json();
            detalle = error.message || error.detail || '';
        } catch (_) {
            // La respuesta de error puede no contener JSON.
        }
        throw new Error(detalle || `Error HTTP ${respuesta.status}.`);
    }

    if (respuesta.status === 204) return null;
    return respuesta.json();
}

function pintarTickets(tickets) {
    cuerpoTabla.replaceChildren();

    if (!tickets.length) {
        mostrarMensajeTabla('No hay tickets registrados.', 'text-secondary');
        return;
    }

    tickets.forEach(ticket => cuerpoTabla.appendChild(crearFila(ticket)));
}

function crearFila(ticket) {
    const fila = document.createElement('tr');
    agregarCelda(fila, ticket.id);
    agregarCelda(fila, ticket.solicitante);
    agregarCelda(fila, ticket.area);
    agregarCelda(fila, ticket.asunto);

    const configuracion = prioridades[ticket.prioridad]
        ?? { texto: ticket.prioridad, clase: 'text-bg-secondary' };
    const badge = document.createElement('span');
    badge.className = `badge ${configuracion.clase}`;
    badge.textContent = configuracion.texto;
    fila.insertCell().appendChild(badge);

    const selector = crearSelectorEstado(ticket);
    fila.insertCell().appendChild(selector);
    agregarCelda(fila, formatearFecha(ticket.fechaCreacion));

    const eliminarBtn = document.createElement('button');
    eliminarBtn.type = 'button';
    eliminarBtn.className = 'btn btn-outline-danger btn-sm';
    eliminarBtn.textContent = 'Eliminar';
    eliminarBtn.addEventListener('click', () => eliminarTicket(ticket.id));
    fila.insertCell().appendChild(eliminarBtn);

    return fila;
}

function crearSelectorEstado(ticket) {
    const estados = {
        PENDIENTE: 'Pendiente',
        EN_PROCESO: 'En proceso',
        RESUELTO: 'Resuelto'
    };
    const selector = document.createElement('select');
    selector.className = 'form-select form-select-sm';
    selector.setAttribute('aria-label', `Estado del ticket ${ticket.id}`);

    Object.entries(estados).forEach(([valor, texto]) => {
        const opcion = document.createElement('option');
        opcion.value = valor;
        opcion.textContent = texto;
        opcion.selected = valor === ticket.estado;
        selector.appendChild(opcion);
    });

    selector.addEventListener('change', () => actualizarEstado(ticket.id, selector.value, selector));
    return selector;
}

function agregarCelda(fila, valor) {
    const celda = fila.insertCell();
    celda.textContent = valor ?? '';
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(fecha));
}

function mostrarMensajeTabla(mensaje, clase) {
    cuerpoTabla.replaceChildren();
    const fila = cuerpoTabla.insertRow();
    const celda = fila.insertCell();
    celda.colSpan = 8;
    celda.className = `text-center ${clase} py-4`;
    celda.textContent = mensaje;
}

function cambiarEstadoBotonGuardar(guardando) {
    guardarBtn.disabled = guardando;
    guardarBtn.textContent = guardando ? 'Guardando...' : 'Guardar ticket';
}

function mostrarAlerta(mensaje, tipo) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show shadow`;
    alerta.setAttribute('role', 'alert');
    alerta.append(document.createTextNode(mensaje));

    const cerrarBtn = document.createElement('button');
    cerrarBtn.type = 'button';
    cerrarBtn.className = 'btn-close';
    cerrarBtn.setAttribute('data-bs-dismiss', 'alert');
    cerrarBtn.setAttribute('aria-label', 'Cerrar');
    alerta.appendChild(cerrarBtn);

    document.getElementById('alertas').appendChild(alerta);
    window.setTimeout(() => bootstrap.Alert.getOrCreateInstance(alerta).close(), 4000);
}
