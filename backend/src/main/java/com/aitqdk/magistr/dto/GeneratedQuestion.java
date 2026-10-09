package com.aitqdk.magistr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeneratedQuestion {
    private String sual = "";
    private Map<String, String> variantlar;
    private String dogruCavab;
    private String izah = "";
    private String movzu = "";
    private String cetinlik = "orta";
    private String sualShekil;
    private String fenn;
    /** Həndəsi fiqur/bucaq təsviri — AI şəkil çəkə bilmədiyi üçün strukturlaşdırılmış cavab verir,
     * frontend bunu SVG ilə çəkir (bax GeometryFigure.tsx). Sxem: {"type":"triangle|rectangle|trapezoid|circle|angle",
     * "sides":["5 sm",...], "angles":["60°",...], "rightAngleAt":0, "width":"4 sm", "height":"3 sm",
     * "square":true, "a":"10 sm", "b":"6 sm", "radius":"5 sm", "diameter":"...", "value":"60°",
     * "kind":"iti|düz|kor|düzxətli"}. Prompt təlimatı AiService.dimFormatTesviri()-də (Riyaziyyat). */
    private Map<String, Object> figura;
}
