package com.aitqdk.magistr.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.util.List;

/**
 * Next.js statik export-u ("next build" ilə output: "export") çoxsəhifəli sayt kimi
 * yaradır (məs. /admin üçün admin.html). Spring-in default statik resurs handler-i
 * "/admin" kimi uzantısız yolları avtomatik "admin.html"-ə uyğunlaşdırmır — bu
 * resolver həmin uyğunlaşdırmanı əlavə edir (əvvəlcə tam uyğunluq, sonra "+.html",
 * sonra "index.html" fallback).
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // sw.js gates every static-asset update (it deletes old caches and re-fetches
        // fresh copies on activate) — without an explicit no-cache header here, browsers
        // apply their own heuristic freshness lifetime to it, which can delay a deployed
        // change (new logo, etc.) from ever reaching an already-open tab for hours.
        registry.addResourceHandler("/sw.js")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noCache());

        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        if (!resourcePath.contains(".")) {
                            Resource htmlVariant = location.createRelative(resourcePath + ".html");
                            if (htmlVariant.exists() && htmlVariant.isReadable()) {
                                return htmlVariant;
                            }
                            Resource indexVariant = location.createRelative(
                                    resourcePath + (resourcePath.endsWith("/") ? "" : "/") + "index.html");
                            if (indexVariant.exists() && indexVariant.isReadable()) {
                                return indexVariant;
                            }
                        }
                        return null;
                    }
                });
    }
}
