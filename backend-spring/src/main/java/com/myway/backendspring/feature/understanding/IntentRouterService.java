package com.myway.backendspring.feature.understanding;

import java.util.List;
import java.util.Map;

public interface IntentRouterService {
    String routeForIntent(String intent, UnderstandingContext context, List<Map<String, Object>> entities);
}
