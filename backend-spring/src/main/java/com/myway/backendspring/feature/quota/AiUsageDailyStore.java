package com.myway.backendspring.feature.quota;

import java.time.LocalDate;

public interface AiUsageDailyStore {
    int getCount(String userId, LocalDate day);

    void upsertCount(String userId, LocalDate day, int count);
}

