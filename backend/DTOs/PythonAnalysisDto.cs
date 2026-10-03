using System.Text.Json.Serialization;

namespace backend.DTOs
{
    public class PythonAnalysisDto
    {
        [JsonPropertyName("container_id")]
        public string ContainerId { get; set; } = string.Empty;

        [JsonPropertyName("priority_score")]
        public int PriorityScore { get; set; }

        [JsonPropertyName("risk_level")]
        public string RiskLevel { get; set; } = string.Empty;

        [JsonPropertyName("expected_dwell_hours")]
        public int ExpectedDwellHours { get; set; }

        [JsonPropertyName("explanation")]
        public string Explanation { get; set; } = string.Empty;
    }
}