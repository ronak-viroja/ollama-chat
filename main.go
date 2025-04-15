package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os/exec"
	"strings"
)

type Model struct {
	Name string `json:"name"`
}

type ModelList struct {
	Models []Model `json:"models"`
}

type ChatRequest struct {
	Model   string `json:"model"`
	Message string `json:"message"`
}

type ChatResponse struct {
	Response string `json:"response"`
}

func main() {
	// Serve static files (CSS, JS)
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Serve index page
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		tmpl, err := template.ParseFiles("templates/index.html")
		if err != nil {
			http.Error(w, "Error loading template", http.StatusInternalServerError)
			return
		}
		tmpl.Execute(w, nil)
	})

	// API to list models
	http.HandleFunc("/api/models", func(w http.ResponseWriter, r *http.Request) {
		cmd := exec.Command("ollama", "list")
		output, err := cmd.Output()
		if err != nil {
			http.Error(w, "Error fetching models", http.StatusInternalServerError)
			return
		}

		lines := strings.Split(string(output), "\n")
		var models []Model
		for i, line := range lines {
			if i == 0 || line == "" {
				continue // Skip header and empty lines
			}
			fields := strings.Fields(line)
			if len(fields) > 0 {
				models = append(models, Model{Name: fields[0]})
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ModelList{Models: models})
	})

	// API to handle chat
	http.HandleFunc("/api/chat", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req ChatRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		ollamaReq := map[string]interface{}{
			"model":  req.Model,
			"prompt": req.Message,
			"stream": false,
		}
		ollamaBody, _ := json.Marshal(ollamaReq)

		resp, err := http.Post("http://localhost:11434/api/generate", "application/json", bytes.NewBuffer(ollamaBody))
		if err != nil {
			http.Error(w, "Error communicating with Ollama", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		var ollamaResp struct {
			Response string `json:"response"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
			http.Error(w, "Error parsing Ollama response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ChatResponse{Response: ollamaResp.Response})
	})

	// API to handle file upload
	http.HandleFunc("/api/upload", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		file, _, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "Error uploading file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		// Log filename (expandable to process file later)
		fmt.Println("File uploaded:", r.FormValue("file"))
		w.Write([]byte("File uploaded successfully"))
	})

	fmt.Println("Server starting on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
