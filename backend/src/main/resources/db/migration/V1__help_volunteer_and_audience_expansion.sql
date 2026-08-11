ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS audience_expanded_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS help_volunteer_requests (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id),
    volunteer_user_id BIGINT NOT NULL REFERENCES users(id),
    requested_to_user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(24) NOT NULL,
    conversation_id BIGINT UNIQUE REFERENCES help_conversations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_volunteer_request_owner_status
    ON help_volunteer_requests(requested_to_user_id, status);

CREATE INDEX IF NOT EXISTS idx_volunteer_request_post_status
    ON help_volunteer_requests(post_id, status);
