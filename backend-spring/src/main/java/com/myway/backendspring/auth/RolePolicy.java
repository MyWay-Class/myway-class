package com.myway.backendspring.auth;

public final class RolePolicy {
    private RolePolicy() {}

    public static boolean isAdmin(String role) {
        return "admin".equals(role);
    }

    public static boolean canManageCourses(String role) {
        return isAdmin(role) || "instructor".equals(role);
    }
}
