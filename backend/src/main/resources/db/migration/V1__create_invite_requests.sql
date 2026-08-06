CREATE TABLE IF NOT EXISTS invite_requests (
    id BIGSERIAL PRIMARY KEY,
    request_token VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    verification_code_id BIGINT,
    reviewed_by_admin_id BIGINT,
    requested_at TIMESTAMPTZ NOT NULL,
    approved_at TIMESTAMPTZ,
    CONSTRAINT chk_invite_request_status CHECK (status IN ('PENDING', 'APPROVED'))
);

CREATE INDEX IF NOT EXISTS idx_invite_requests_status_requested
    ON invite_requests (status, requested_at);

CREATE INDEX IF NOT EXISTS idx_invite_requests_identity
    ON invite_requests (email, phone_number);
