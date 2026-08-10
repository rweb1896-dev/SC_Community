package com.sc.community.dto;

public final class UploadDtos {
    private UploadDtos() {}
    public record ImageUploadResponse(String imageUrl, String contentType, long sizeBytes) {}
}
