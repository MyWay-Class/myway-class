package com.myway.backendspring.feature.understanding;

import java.util.Map;

public interface UnderstandingPersistenceService {
    Map<String, Object> save(UnderstandingContext context, UnderstandingResult result);

    Map<String, Object> loadById(String id);
}
