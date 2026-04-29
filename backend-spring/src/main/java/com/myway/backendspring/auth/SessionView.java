package com.myway.backendspring.auth;

import java.util.List;

public record SessionView(String session_token, DemoUser user, List<String> permissions) {}
