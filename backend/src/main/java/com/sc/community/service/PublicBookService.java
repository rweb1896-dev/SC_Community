package com.sc.community.service;

import static java.util.Map.entry;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PublicBookService {
    private static final int DEFAULT_MAX_PDF_BYTES = 45 * 1024 * 1024;

    private final HttpClient httpClient;
    private final Map<String, BookSource> sources;
    private final int maxPdfBytes;

    public PublicBookService() {
        this(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build(), defaultSources(), DEFAULT_MAX_PDF_BYTES);
    }

    PublicBookService(HttpClient httpClient, Map<String, BookSource> sources, int maxPdfBytes) {
        this.httpClient = httpClient;
        this.sources = Map.copyOf(sources);
        this.maxPdfBytes = maxPdfBytes;
    }

    public PdfData pdf(String bookId) {
        BookSource source = sources.get(bookId);
        if (source == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Book PDF not found");
        }

        HttpRequest request = HttpRequest.newBuilder(URI.create(source.url()))
                .timeout(Duration.ofSeconds(25))
                .header("Accept", "application/pdf")
                .header("User-Agent", "SC-Community-Connect/1.0")
                .GET()
                .build();

        try {
            HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
            try (InputStream body = response.body()) {
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PDF source is currently unavailable");
                }

                byte[] data = readBounded(body);
                if (!isPdf(data)) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PDF source returned invalid content");
                }
                return new PdfData(source.fileName(), data);
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to read PDF source", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PDF request was interrupted", exception);
        }
    }

    private byte[] readBounded(InputStream inputStream) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int total = 0;
        int read;
        while ((read = inputStream.read(buffer)) != -1) {
            total += read;
            if (total > maxPdfBytes) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "PDF is too large to open safely");
            }
            output.write(buffer, 0, read);
        }
        return output.toByteArray();
    }

    private boolean isPdf(byte[] data) {
        return data.length >= 5
                && data[0] == '%'
                && data[1] == 'P'
                && data[2] == 'D'
                && data[3] == 'F'
                && data[4] == '-';
    }

    private static Map<String, BookSource> defaultSources() {
        return Map.ofEntries(
                entry("ambedkar-volume-01", new BookSource(
                        "Annihilation of Caste and Other Writings.pdf",
                        "https://www.mea.gov.in/images/CPV/Volume1.pdf")),
                entry("ambedkar-volume-03", new BookSource(
                        "Dr. Babasaheb Ambedkar Writings and Speeches Vol. 3.pdf",
                        "https://www.mea.gov.in/images/CPV/Volume3.pdf")),
                entry("ambedkar-volume-07", new BookSource(
                        "Who Were the Shudras and The Untouchables.pdf",
                        "https://www.mea.gov.in/images/CPV/Volume7.pdf")),
                entry("ambedkar-volume-17-01", new BookSource(
                        "Dr. B. R. Ambedkar and His Egalitarian Revolution.pdf",
                        "https://www.mea.gov.in/images/CPV/Volume17_Part_I.pdf")),
                entry("constitution-2024", new BookSource(
                        "The Constitution of India 2024 Edition.pdf",
                        "https://lddashboard.legislative.gov.in/sites/default/files/coi/COI_2024.pdf")),
                entry("jagjivan-ram-profile", new BookSource(
                        "Selected Speeches of Babu Jagjivan Ram Vol 7.pdf",
                        "https://www.mea.gov.in/images/CPV/VolumeH7.pdf")));
    }

    public record PdfData(String fileName, byte[] data) {
        public long sizeBytes() {
            return data.length;
        }
    }

    record BookSource(String fileName, String url) {}
}
