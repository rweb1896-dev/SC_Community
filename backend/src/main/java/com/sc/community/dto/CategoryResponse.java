package com.sc.community.dto;

import com.sc.community.entity.Category;

public record CategoryResponse(Long id, String key, String name, String description) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), stableKey(category.getName()), category.getName(), category.getDescription());
    }

    private static String stableKey(String name) {
        String value = name == null ? "" : name.toLowerCase();
        if (value.contains("health")) return "healthHelp";
        if (value.contains("job")) return "jobUpdates";
        if (value.contains("business")) return "businessGrowth";
        if (value.contains("education")) return "education";
        if (value.contains("community")) return "community";
        return "openForum";
    }
}
