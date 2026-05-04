package com.myway.backendspring.auth;

public record DemoUser(
        String id,
        String name,
        String email,
        String role,
        String department,
        String bio
) {}
