package com.aitqdk.magistr.ai;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * PDF səhifələrini şəklə çevirmə (ai.ts renderPDFPagesAsImages) və sual sahəsini
 * normallaşdırılmış box_2d ([yMin,xMin,yMax,xMax], 0-1000) üzrə kəsmə (cropQuestionImage).
 */
@Slf4j
@Component
public class ImageService {

    private static final double PAD = 0.008;

    public List<String> renderPdfPagesAsPngBase64(byte[] pdfBytes) {
        List<String> images = new ArrayList<>();
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            PDFRenderer renderer = new PDFRenderer(doc);
            for (int i = 0; i < doc.getNumberOfPages(); i++) {
                BufferedImage img = renderer.renderImageWithDPI(i, 144, ImageType.RGB);
                images.add(toPngBase64(img));
            }
        } catch (Exception e) {
            log.error("PDF render xətası", e);
        }
        return images;
    }

    public String cropByNormalizedBox(String sourceBase64Png, int[] box) {
        try {
            byte[] bytes = Base64.getDecoder().decode(sourceBase64Png);
            BufferedImage img = ImageIO.read(new java.io.ByteArrayInputStream(bytes));
            int w = img.getWidth();
            int h = img.getHeight();
            int yMin = box[0], xMin = box[1], yMax = box[2], xMax = box[3];

            int sx = Math.max(0, (int) Math.round((xMin / 1000.0 - PAD) * w));
            int sy = Math.max(0, (int) Math.round((yMin / 1000.0 - PAD) * h));
            int ex = Math.min(w, (int) Math.round((xMax / 1000.0 + PAD) * w));
            int ey = Math.min(h, (int) Math.round((yMax / 1000.0 + PAD) * h));
            int sw = Math.max(1, ex - sx);
            int sh = Math.max(1, ey - sy);
            sw = Math.min(sw, w - sx);
            sh = Math.min(sh, h - sy);

            BufferedImage cropped = img.getSubimage(sx, sy, sw, sh);
            return toPngBase64(cropped);
        } catch (Exception e) {
            log.error("Sual şəkli kəsilə bilmədi", e);
            return null;
        }
    }

    private String toPngBase64(BufferedImage img) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return Base64.getEncoder().encodeToString(out.toByteArray());
    }
}
