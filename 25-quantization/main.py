"""Module 25: quantization.

Scenario: take a batch of real floating-point numbers (simulating model
weights), quantize them down to 8-bit integers, then dequantize back to
floating point. Shows concretely how much memory this saves and how much
numeric precision is lost per value.
"""
import torch

torch.manual_seed(42)


def quantize_dequantize(weights: torch.Tensor) -> dict:
    min_val, max_val = weights.min().item(), weights.max().item()
    scale = (max_val - min_val) / 255
    zero_point = round(-min_val / scale)

    quantized = torch.clamp(torch.round(weights / scale) + zero_point, 0, 255).to(torch.uint8)
    dequantized = (quantized.to(torch.float32) - zero_point) * scale
    errors = (weights - dequantized).abs()

    return {
        "original": [round(v, 4) for v in weights.tolist()],
        "quantized_int8": [int(v) for v in quantized.tolist()],
        "dequantized": [round(v, 4) for v in dequantized.tolist()],
        "error": [round(v, 6) for v in errors.tolist()],
        "mean_abs_error": round(errors.mean().item(), 6),
        "max_abs_error": round(errors.max().item(), 6),
    }


def compute_demo(num_weights: int = 12) -> dict:
    weights = torch.randn(num_weights) * 2.5
    result = quantize_dequantize(weights)

    fp32_bytes = num_weights * 4
    int8_bytes = num_weights * 1
    result.update(
        {
            "num_weights": num_weights,
            "fp32_bytes": fp32_bytes,
            "int8_bytes": int8_bytes,
            "memory_reduction_factor": fp32_bytes / int8_bytes,
        }
    )
    return result


def main():
    result = compute_demo()

    print(f"{'original':>10} {'quantized':>10} {'dequantized':>12} {'error':>10}")
    for o, q, d, e in zip(result["original"], result["quantized_int8"], result["dequantized"], result["error"]):
        print(f"{o:>10.4f} {q:>10d} {d:>12.4f} {e:>10.6f}")

    print(f"\nmean abs error: {result['mean_abs_error']:.6f}")
    print(f"max abs error:  {result['max_abs_error']:.6f}")
    print(
        f"\nmemory: {result['fp32_bytes']} bytes (float32) -> {result['int8_bytes']} bytes (int8), "
        f"a {result['memory_reduction_factor']:.0f}x reduction."
    )
    print(
        "Quantizing to int8 uses 4x less memory than the original float32 weights, "
        "at the cost of small rounding errors per value -- typically acceptable since "
        "model weights are somewhat redundant/robust to small perturbations."
    )


if __name__ == "__main__":
    main()
