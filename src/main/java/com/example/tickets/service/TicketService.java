package com.example.tickets.service;

import com.example.tickets.model.Estado;
import com.example.tickets.model.Ticket;
import com.example.tickets.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Transactional
    public Ticket crear(Ticket ticket) {
        ticket.setId(null);
        return ticketRepository.save(ticket);
    }

    public List<Ticket> listarTodos() {
        return ticketRepository.findAll();
    }

    public Optional<Ticket> buscarPorId(Long id) {
        return ticketRepository.findById(id);
    }

    @Transactional
    public Optional<Ticket> cambiarEstado(Long id, Estado nuevoEstado) {
        return ticketRepository.findById(id)
                .map(ticket -> {
                    ticket.setEstado(nuevoEstado);
                    return ticketRepository.save(ticket);
                });
    }

    @Transactional
    public boolean eliminar(Long id) {
        if (!ticketRepository.existsById(id)) {
            return false;
        }

        ticketRepository.deleteById(id);
        return true;
    }
}
