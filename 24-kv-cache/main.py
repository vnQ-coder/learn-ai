"""Module 24: KV cache — why autoregressive generation caches Key/Value
vectors instead of recomputing them at every step.

Without a cache, generating the t-th token recomputes attention Key/Value
work for all t tokens seen so far, at every single step. Total work across
generating N tokens grows O(N^2). With a cache, each step only computes
K/V for the one new token and reuses everything already cached, so total
work grows O(N) instead. The tradeoff: the cache itself consumes memory
that grows with sequence length.
"""


def simulate(
    num_tokens: int = 20,
    num_layers: int = 12,
    num_heads: int = 12,
    head_dim: int = 64,
    bytes_per_param: int = 4,
) -> dict:
    steps = []
    naive_cumulative = 0
    cached_cumulative = 0
    cache_memory_mb = 0.0

    for t in range(1, num_tokens + 1):
        naive_ops_this_step = t
        cached_ops_this_step = 1

        naive_cumulative += naive_ops_this_step
        cached_cumulative += cached_ops_this_step

        cache_memory_bytes_this_step = 2 * num_layers * num_heads * head_dim * t * bytes_per_param
        cache_memory_mb = round(cache_memory_bytes_this_step / (1024 * 1024), 4)

        steps.append(
            {
                "step": t,
                "naive_cumulative_ops": naive_cumulative,
                "cached_cumulative_ops": cached_cumulative,
                "cache_memory_mb": cache_memory_mb,
            }
        )

    return {
        "steps": steps,
        "final_naive_ops": naive_cumulative,
        "final_cached_ops": cached_cumulative,
        "speedup_factor": round(naive_cumulative / cached_cumulative, 1),
        "final_cache_memory_mb": cache_memory_mb,
    }


def main():
    result = simulate()
    print("Last 5 steps:")
    for s in result["steps"][-5:]:
        print(
            f"  step {s['step']:>3}  naive_cumulative_ops={s['naive_cumulative_ops']:>5}  "
            f"cached_cumulative_ops={s['cached_cumulative_ops']:>3}  cache_memory_mb={s['cache_memory_mb']}"
        )
    print(f"\nFinal naive ops:  {result['final_naive_ops']}")
    print(f"Final cached ops: {result['final_cached_ops']}")
    print(f"Speedup factor:   {result['speedup_factor']}x")
    print(f"Final cache memory: {result['final_cache_memory_mb']} MB")
    print(
        f"\nGenerating {len(result['steps'])} tokens without a cache does "
        f"~{result['speedup_factor']}x more attention work in total than generating with a cache, "
        f"and the cache itself only costs {result['final_cache_memory_mb']} MB of memory to maintain."
    )


if __name__ == "__main__":
    main()
