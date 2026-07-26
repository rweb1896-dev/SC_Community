package com.sc.community.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    @GetMapping({"/", "/login", "/feed", "/chat", "/meetings", "/meetings/{meetingId}", "/admin"})
    public String frontend() {
        return "forward:/index.html";
    }
}
