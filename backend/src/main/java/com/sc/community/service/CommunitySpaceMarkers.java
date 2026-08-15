package com.sc.community.service;

/** Internal markers keep member-written content separate from help requests without a schema migration. */
public final class CommunitySpaceMarkers {
    public static final String DEBATE_PREFIX = "[[SC_DEBATE]]";
    public static final String BLOG_PREFIX = "SC-MANAGED:USER_BLOG:";

    private CommunitySpaceMarkers() { }

    public static boolean isDebateContent(String content) {
        return content != null && content.startsWith(DEBATE_PREFIX);
    }

    public static boolean isBlogMarker(String title) {
        return title != null && title.startsWith(BLOG_PREFIX);
    }
}
