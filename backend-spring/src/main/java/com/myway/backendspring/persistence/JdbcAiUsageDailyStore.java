package com.myway.backendspring.persistence;

import com.myway.backendspring.feature.quota.AiUsageDailyStore;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public class JdbcAiUsageDailyStore implements AiUsageDailyStore {
    private final FeatureJdbcStore store;

    public JdbcAiUsageDailyStore(FeatureJdbcStore store) {
        this.store = store;
    }

    @Override
    public int getCount(String userId, LocalDate day) {
        return store.getAiUsageDailyCount(userId, day);
    }

    @Override
    public void upsertCount(String userId, LocalDate day, int count) {
        store.upsertAiUsageDaily(userId, day, count);
    }
}

