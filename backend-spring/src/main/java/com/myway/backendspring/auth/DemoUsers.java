package com.myway.backendspring.auth;

import java.util.List;
import java.util.Map;

public final class DemoUsers {
    private DemoUsers() {}

    public static final List<DemoUser> USERS = List.of(
            new DemoUser("usr_admin_001", "Admin Kim", "admin@myway.local", "admin", "Platform", "Platform administrator"),
            new DemoUser("usr_ins_001", "Instructor Lee", "instructor@myway.local", "instructor", "Education", "Course instructor"),
            new DemoUser("usr_std_001", "Student Park", "student@myway.local", "student", "Learning", "Learner account")
    );

    public static final Map<String, List<String>> ROLE_PERMISSIONS = Map.of(
            "admin", List.of("admin:all", "course:manage", "dashboard:view"),
            "instructor", List.of("course:manage", "lecture:manage", "dashboard:view"),
            "student", List.of("course:view", "enroll:create", "dashboard:view")
    );
}
