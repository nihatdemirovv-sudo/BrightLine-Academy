package com.aitqdk.magistr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DailyTask {
    private String fenn;
    private String movzu;
    private int sualSayi;
    private String movzuQisa;
    private String onem;
    private Boolean tamamlandi;
}
