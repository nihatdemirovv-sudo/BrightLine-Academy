package com.aitqdk.magistr.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class AsyncConfig {

    /** Java 21 virtual threads — AI sorğularını paralel yürütmək üçün (bir çox blocking HTTP çağırışı). */
    @Bean
    public ExecutorService aiExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
