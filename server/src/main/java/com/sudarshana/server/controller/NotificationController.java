package com.sudarshana.server.controller;

import com.sudarshana.server.model.Notification;
import com.sudarshana.server.model.User;
import com.sudarshana.server.repository.NotificationRepository;
import com.sudarshana.server.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Autowired
    public NotificationController(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Notification> notifications = notificationRepository.findByUserIdOrderByTimestampDesc(user.getId());
        return ResponseEntity.ok(notifications);
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        notification.setUserId(user.getId());
        if (notification.getTimestamp() == 0) {
            notification.setTimestamp(System.currentTimeMillis());
        }
        Notification saved = notificationRepository.save(notification);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return notificationRepository.findById(id)
            .filter(n -> n.getUserId().equals(user.getId()))
            .map(n -> {
                n.setRead(true);
                notificationRepository.save(n);
                return ResponseEntity.ok(Map.<String, String>of("status", "SUCCESS"));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Notification> unread = notificationRepository.findUnreadByUserId(user.getId());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok(Map.<String, String>of("status", "SUCCESS"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return notificationRepository.findById(id)
            .filter(n -> n.getUserId().equals(user.getId()))
            .map(n -> {
                notificationRepository.delete(n);
                return ResponseEntity.ok(Map.<String, String>of("status", "SUCCESS"));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
