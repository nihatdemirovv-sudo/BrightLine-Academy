package com.aitqdk.magistr.dto;

import lombok.Data;

@Data
public class GenerateQuestionsRequest {
    private String sessionId;
    private String fenn;
    private Integer say;
    private String movzu;
    /** İstəyə bağlı — verilibsə, tələbənin ÖZ qeydiyyat qrupu əvəzinə istifadə olunur (məs. Sual
     * Generatorunda "Magistr" rejimi seçiləndə "magistr" göndərilir, tələbə bakalavr qrupunda
     * qeydiyyatdan keçmiş olsa belə). */
    private String qrup;
}
