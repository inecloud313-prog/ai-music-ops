(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("studio-form");
  const apiInput = $("api-base");
  const duration = $("duration");
  let pollTimer = null;
  apiInput.value = localStorage.getItem("aio_api_base") || "";
  duration.addEventListener("input", () => $("duration-value").textContent = duration.value);

  function setNotice(message, error = false) {
    $("notice").textContent = message;
    $("notice").style.color = error ? "#ff9b9b" : "";
  }
  function setStatus(value) { $("status").textContent = String(value || "UNKNOWN").toUpperCase(); }
  function apiUrl(path) {
    const base = apiInput.value.trim().replace(/\/$/, "");
    if (!base) throw new Error("Enter your deployed FastAPI backend URL first.");
    return base + path;
  }
  async function request(path, options = {}) {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || data.error || "Backend request failed (" + response.status + ").");
    return data;
  }
  async function poll(jobId) {
    try {
      const job = await request("/api/generations/" + encodeURIComponent(jobId));
      setStatus(job.status);
      if (job.status === "succeeded") {
        clearInterval(pollTimer);
        const audioUrl = Array.isArray(job.output) ? job.output[0] : job.output;
        if (!audioUrl) throw new Error("The provider completed the job but returned no audio URL.");
        $("player").src = audioUrl;
        $("player").hidden = false;
        $("download").href = audioUrl;
        $("download").hidden = false;
        $("result-title").textContent = job.track_name || "Your generated track";
        $("result-description").textContent = "Your track is ready. Preview it or download the MP3.";
        setNotice("Generation complete. Your track is ready.");
        $("generate").disabled = false;
      } else if (job.status === "failed" || job.status === "canceled") {
        clearInterval(pollTimer);
        setNotice(job.error || "Generation did not complete.", true);
        $("generate").disabled = false;
      } else {
        setNotice("Your track is being generated. This can take a few minutes.");
      }
    } catch (error) {
      clearInterval(pollTimer);
      setNotice(error.message, true);
      $("generate").disabled = false;
    }
  }
  apiInput.addEventListener("change", () => localStorage.setItem("aio_api_base", apiInput.value.trim()));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearInterval(pollTimer);
    $("generate").disabled = true;
    $("player").hidden = true;
    $("download").hidden = true;
    $("result-title").textContent = "Creating your track…";
    $("result-description").textContent = "Your generation request is being sent securely to the backend.";
    setStatus("QUEUED");
    setNotice("Connecting to AI Music Ops backend…");
    try {
      const health = await request("/api/health");
      if (health.status !== "ok") throw new Error("The backend health check did not pass.");
      const payload = {
        track_name: $("track-name").value.trim() || "Untitled track",
        prompt: [
          $("prompt").value.trim(),
          "Genre: " + $("genre").value,
          "Mood: " + $("mood").value,
          "Vocal direction: " + $("vocals").value,
          "Energy: " + $("energy").value
        ].join(". "),
        duration: Number(duration.value),
        output_format: "mp3"
      };
      const job = await request("/api/generations", { method: "POST", body: JSON.stringify(payload) });
      $("job-id").textContent = job.id;
      setStatus(job.status);
      setNotice("Generation started. Checking progress…");
      await poll(job.id);
      pollTimer = setInterval(() => poll(job.id), 5000);
    } catch (error) {
      setStatus("ERROR");
      setNotice(error.message, true);
      $("result-title").textContent = "Backend connection needed";
      $("generate").disabled = false;
    }
  });
})();