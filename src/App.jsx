import { useState } from "react";
import axios from "axios";

export default function SonarPrediction() {
  const [features, setFeatures] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFeatures(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!features.trim()) {
      alert("Please enter some data before predicting.");
      return;
    }

    setLoading(true);
    const featureArray = features.split(",").map(Number);

    try {
      const response = await axios.post(
        "https://sonar-rock-vs-mine-api.onrender.com/predict",
        { features: featureArray }
      );

      const formattedPrediction = response.data.prediction === "M" ? "Mine" : "Rock";
      setPrediction(formattedPrediction);
    } catch (error) {
      console.error("Prediction error", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const testData = [
    {
      features: "0.02,0.0371,0.0428,0.0207,0.0954,0.0986,0.1539,0.1601,0.3109,0.2111,0.1609,0.1582,0.2238,0.0645,0.066,0.2273,0.31,0.2999,0.5078,0.4797,0.5783,0.5071,0.4328,0.555,0.6711,0.6415,0.7104,0.808,0.6791,0.3857,0.1307,0.2604,0.5121,0.7547,0.8537,0.8507,0.6692,0.6097,0.4943,0.2744,0.051,0.2834,0.2825,0.4256,0.2641,0.1386,0.1051,0.1343,0.0383,0.0324,0.0232,0.0027,0.0065,0.0159,0.0072,0.0167,0.018,0.0084,0.009,0.0032",
      label: "Rock",
    },
    {
      features: "0.0179,0.0136,0.0408,0.0633,0.0596,0.0808,0.209,0.3465,0.5276,0.5965,0.6254,0.4507,0.3693,0.2864,0.1635,0.0422,0.1785,0.4394,0.695,0.8097,0.855,0.8717,0.8601,0.9201,0.8729,0.8084,0.8694,0.8411,0.5793,0.3754,0.3485,0.4639,0.6495,0.6901,0.5666,0.5188,0.506,0.3885,0.3762,0.3738,0.2605,0.1591,0.1875,0.2267,0.1577,0.1211,0.0883,0.085,0.0355,0.0219,0.0086,0.0123,0.006,0.0187,0.0111,0.0126,0.0081,0.0155,0.016,0.0085",
      label: "Mine",
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className="flex flex-col items-center text-center shadow-lg rounded-lg p-6 w-full">
        <h1 className="text-2xl font-bold mb-4">Sonar Mine vs Rock Prediction</h1>

        {/* Prediction Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={features}
            onChange={handleChange}
            placeholder="Enter features, comma-separated"
            className="border p-2 w-full rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Predict"}
          </button>
        </form>

        {/* Prediction Result */}
        {prediction !== null && (
          <div className="mt-4 text-lg font-semibold">
            Prediction: <span className="text-blue-600">{prediction}</span>
          </div>
        )}

        {/* Test Data Table */}
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-lg font-bold">Test Data</h2>

          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Features</th>
                <th className="border border-gray-300 p-2">Expected Label</th>
                <th className="border border-gray-300 p-2">Copy</th>
              </tr>
            </thead>
            <tbody>
              {testData.map((row, index) => (
                <tr key={index} className="text-center">
                  <td className="border border-gray-300 p-2">
                    {row.features.split(",").length > 5 ? (
                      <span title={row.features}>
                        {row.features.split(",").slice(0, 5).join(", ")}...
                      </span>
                    ) : (
                      row.features
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">{row.label}</td>
                  <td className="border border-gray-300 p-2">
                    <button
                      onClick={() => copyToClipboard(row.features)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
