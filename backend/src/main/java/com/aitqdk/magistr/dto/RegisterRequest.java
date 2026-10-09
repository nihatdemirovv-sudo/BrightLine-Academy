package com.aitqdk.magistr.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String ad;
    private String qrup;

    // Rol seçimi — null/"telebe" = tələbə (mövcud axın), "muellim" = müəllim (təsdiq gözləyir)
    private String rol;
    private String email;
    private String telefon;
    private String dogumTarixi;

    // Yalnız rol="muellim" olanda tələb olunur
    private String muellimFenni;
    private String muellimSened;
}
