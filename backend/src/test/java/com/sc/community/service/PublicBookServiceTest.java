package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class PublicBookServiceTest {
    private HttpServer server;
    private String baseUrl;

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        baseUrl = "http://localhost:" + server.getAddress().getPort();
        server.start();
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
    }

    @Test
    void returnsPdfForKnownBook() {
        byte[] body = "%PDF-1.7\npublic document".getBytes(StandardCharsets.UTF_8);
        serve("/book.pdf", 200, "application/pdf", body);

        PublicBookService service = serviceFor("/book.pdf", 2048);
        PublicBookService.PdfData pdf = service.pdf("book");

        assertThat(pdf.fileName()).isEqualTo("Book.pdf");
        assertThat(pdf.data()).isEqualTo(body);
        assertThat(pdf.sizeBytes()).isEqualTo(body.length);
    }

    @Test
    void rejectsSourceThatDoesNotReturnPdfBytes() {
        serve("/book.pdf", 200, "text/html", "<html>not pdf</html>".getBytes(StandardCharsets.UTF_8));

        PublicBookService service = serviceFor("/book.pdf", 2048);

        assertThatThrownBy(() -> service.pdf("book"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY));
    }

    @Test
    void rejectsOversizedPdf() {
        serve("/book.pdf", 200, "application/pdf", "%PDF-1.7\nlarge".getBytes(StandardCharsets.UTF_8));

        PublicBookService service = serviceFor("/book.pdf", 4);

        assertThatThrownBy(() -> service.pdf("book"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE));
    }

    @Test
    void unknownBookReturnsNotFound() {
        PublicBookService service = new PublicBookService(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build(),
                Map.of(),
                2048);

        assertThatThrownBy(() -> service.pdf("missing"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    private PublicBookService serviceFor(String path, int maxPdfBytes) {
        return new PublicBookService(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build(),
                Map.of("book", new PublicBookService.BookSource("Book.pdf", baseUrl + path)),
                maxPdfBytes);
    }

    private void serve(String path, int status, String contentType, byte[] body) {
        server.createContext(path, exchange -> respond(exchange, status, contentType, body));
    }

    private void respond(HttpExchange exchange, int status, String contentType, byte[] body) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(status, body.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(body);
        }
    }
}
