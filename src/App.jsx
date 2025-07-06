import { useState } from "react";
import { AlertCircle, Copy, Check, Loader2, Target, Activity } from "lucide-react";

export default function SonarPrediction() {
  const [features, setFeatures] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [confidence, setConfidence] = useState(null);

  const handleChange = (e) => {
    setFeatures(e.target.value);
    setError("");
  };

  const validateFeatures = (featureArray) => {
    if (featureArray.length !== 60) {
      throw new Error(`Expected 60 features, got ${featureArray.length}`);
    }
    if (featureArray.some(isNaN)) {
      throw new Error("All features must be valid numbers");
    }
    if (featureArray.some(val => val < 0 || val > 1)) {
      throw new Error("Features should be normalized between 0 and 1");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!features.trim()) {
      setError("Please enter sonar data before predicting.");
      return;
    }

    setLoading(true);
    setError("");
    setPrediction(null);
    setConfidence(null);

    try {
      const featureArray = features.split(",").map(str => {
        const num = parseFloat(str.trim());
        if (isNaN(num)) {
          throw new Error(`Invalid number: "${str.trim()}"`);
        }
        return num;
      });

      validateFeatures(featureArray);

      // Simulate API call with mock response since we can't use axios
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock prediction logic based on feature patterns
      const avgValue = featureArray.reduce((sum, val) => sum + val, 0) / featureArray.length;
      const variance = featureArray.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / featureArray.length;
      
      const isMine = avgValue > 0.15 && variance > 0.05;
      const mockConfidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
      
      setPrediction(isMine ? "Mine" : "Rock");
      setConfidence(mockConfidence);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const testData = [
    {
      features: "0.02,0.0371,0.0428,0.0207,0.0954,0.0986,0.1539,0.1601,0.3109,0.2111,0.1609,0.1582,0.2238,0.0645,0.066,0.2273,0.31,0.2999,0.5078,0.4797,0.5783,0.5071,0.4328,0.555,0.6711,0.6415,0.7104,0.808,0.6791,0.3857,0.1307,0.2604,0.5121,0.7547,0.8537,0.8507,0.6692,0.6097,0.4943,0.2744,0.051,0.2834,0.2825,0.4256,0.2641,0.1386,0.1051,0.1343,0.0383,0.0324,0.0232,0.0027,0.0065,0.0159,0.0072,0.0167,0.018,0.0084,0.009,0.0032",
      label: "Rock",
      description: "Low-density object with smooth surface characteristics"
    },
    {
      features: "0.0179,0.0136,0.0408,0.0633,0.0596,0.0808,0.209,0.3465,0.5276,0.5965,0.6254,0.4507,0.3693,0.2864,0.1635,0.0422,0.1785,0.4394,0.695,0.8097,0.855,0.8717,0.8601,0.9201,0.8729,0.8084,0.8694,0.8411,0.5793,0.3754,0.3485,0.4639,0.6495,0.6901,0.5666,0.5188,0.506,0.3885,0.3762,0.3738,0.2605,0.1591,0.1875,0.2267,0.1577,0.1211,0.0883,0.085,0.0355,0.0219,0.0086,0.0123,0.006,0.0187,0.0111,0.0126,0.0081,0.0155,0.016,0.0085",
      label: "Mine",
      description: "High-density metallic object with irregular surface"
    },
    {
      features: "0.0453,0.0523,0.0843,0.0689,0.1183,0.2583,0.2156,0.3481,0.3337,0.2872,0.4918,0.6552,0.6919,0.7797,0.7464,0.9444,1.0000,0.8874,0.8024,0.7818,0.5212,0.4052,0.3957,0.3914,0.3250,0.3200,0.3271,0.2767,0.4423,0.2028,0.3788,0.2947,0.1984,0.2341,0.1306,0.4182,0.3835,0.1057,0.184,0.197,0.1674,0.0583,0.1401,0.1628,0.0621,0.0203,0.053,0.0742,0.0409,0.0061,0.0125,0.0084,0.0089,0.0048,0.0094,0.0191,0.014,0.0049,0.0052,0.0044",
      label: "Mine",
      description: "Dense metallic cylinder with textured surface"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Sonar Classification System</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Classify underwater objects as mines or rocks using sonar signature analysis
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Prediction Engine</h2>
          </div>

          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sonar Features (60 comma-separated values, normalized 0-1)
              </label>
              <textarea
                value={features}
                onChange={handleChange}
                placeholder="Enter 60 sonar features separated by commas (e.g., 0.02,0.0371,0.0428...)"
                className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
              />
              <div className="text-xs text-gray-500 mt-1">
                Features count: {features ? features.split(",").length : 0} / 60
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Sonar Data...
                </>
              ) : (
                "Classify Object"
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Prediction Result */}
          {prediction && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Classification Result</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600">Predicted Class:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      prediction === "Mine" 
                        ? "bg-red-100 text-red-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {prediction}
                    </span>
                  </div>
                  {confidence && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">Confidence: </span>
                      <span className="font-medium">{(confidence * 100).toFixed(1)}%</span>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-4xl">
                  {prediction === "Mine" ? "⚠️" : "🪨"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Data Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sample Test Data</h2>
          <p className="text-gray-600 mb-4">
            Use these verified sonar signatures to test the classification system
          </p>
          
          <div className="grid gap-4">
            {testData.map((row, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.label === "Mine" 
                        ? "bg-red-100 text-red-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {row.label}
                    </span>
                    <span className="text-sm text-gray-600">{row.description}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(row.features, index)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Features
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                  {row.features.split(",").slice(0, 8).join(", ")}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}