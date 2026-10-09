package com.aitqdk.magistr.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Prompt kitabxanasının struktur yoxlaması — model çağırmadan. */
class AiPromptsTest {

  @Test
  @DisplayName("Hər qrupun hər fənni üçün mövzu proqramı və fənn qaydası var")
  void everyGroupSubjectHasSyllabus() {
    for (var entry : Subjects.QRUP_FENLERI.entrySet()) {
      for (String fenn : entry.getValue()) {
        assertThat(AiPrompts.movzular(fenn, entry.getKey())).as(entry.getKey() + " / " + fenn).isNotEmpty();
        assertThat(AiPrompts.fennQaydalari(fenn, entry.getKey())).contains("FƏNN QAYDALARI —");
      }
    }
  }

  @Test
  @DisplayName("LaTeX qaydaları modelə TƏK backslash ilə, JSON nümunəsi isə ikiqat çatır")
  void backslashLevels() {
    assertThat(AiPrompts.LATEX).contains("\\operatorname{tg} x").doesNotContain("\\\\operatorname")
        .contains("$25\\%$").contains("\\mathrm{H_2SO_4}");
    assertThat(AiPrompts.JSON).contains("\"\\\\frac{1}{2}\"");
    assertThat(AiPrompts.QUESTION_JSON_FORMAT).contains("x_1 \\\\cdot x_2");
    assertThat(AiPrompts.fennQaydalari("Riyaziyyat", "1")).contains("$\\dfrac{3}{4}$").doesNotContain("\\\\dfrac");
  }

  @Test
  @DisplayName("Ortaq qaydalar bütün əsas rollara qoşulub")
  void sharedRulesAttached() {
    for (String role : List.of(AiPrompts.TUTOR_SYSTEM, AiPrompts.QUESTION_WRITER_SYSTEM, AiPrompts.MINI_LESSON_SYSTEM,
        AiPrompts.IMAGE_SOLVER_RULES)) {
      assertThat(role).contains("AZƏRBAYCAN DİLİ QAYDALARI").contains("RİYAZİ YAZILIŞ");
    }
    for (String jsonRole : List.of(AiPrompts.QUESTION_WRITER_SYSTEM, AiPrompts.PLANNER_SYSTEM, AiPrompts.ANALYST_SYSTEM,
        AiPrompts.WEAK_TOPIC_SYSTEM, AiPrompts.EXTRACT_RULES)) {
      assertThat(jsonRole).contains("JSON QAYDALARI");
    }
  }

  @Test
  @DisplayName("Qrup təsviri 'sinif' kimi anlaşılmır, təsadüfi fənn tanınır")
  void groupDescriptionAndRandom() {
    assertThat(AiPrompts.qrupTesviri("1")).contains("ixtisas qrupu").contains("İBTİDAİ/ORTA SİNİF DEYİL");
    assertThat(AiPrompts.qrupTesviri("magistr")).contains("Magistratura");
    assertThat(AiPrompts.isRandomFenn("Təsadüfi")).isTrue();
    assertThat(AiPrompts.isRandomFenn("Riyaziyyat")).isFalse();
  }
}
