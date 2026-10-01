"""Module 23: tokenization — real subword tokenization vs naive whitespace split.

Scenario: show a real tokenizer breaking text into subword pieces,
contrasted with naively splitting on whitespace. Makes concrete why
"tokens" aren't the same as "words" — a long or unusual word gets
chopped into several pieces, while a short common word usually stays
whole. This is why AI pricing and context limits are measured in
tokens, not words or characters.
"""
from transformers import AutoTokenizer

TOKENIZER = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")

DEFAULT_TEXT = "The unbelievably antidisestablishmentarian cat sat on the mat."


def tokenize(text: str) -> dict:
    tokens = TOKENIZER.tokenize(text)
    ids = TOKENIZER.encode(text, add_special_tokens=False)
    naive_tokens = text.split()
    return {
        "text": text,
        "real_tokens": tokens,
        "real_token_ids": ids,
        "real_token_count": len(tokens),
        "naive_tokens": naive_tokens,
        "naive_token_count": len(naive_tokens),
    }


def main():
    result = tokenize(DEFAULT_TEXT)
    print(f"Text: {result['text']}\n")

    print(f"Real tokenizer output ({result['real_token_count']} tokens):")
    for tok, tok_id in zip(result["real_tokens"], result["real_token_ids"]):
        print(f"  {tok!r:30} id={tok_id}")

    print(f"\nNaive whitespace split ({result['naive_token_count']} tokens):")
    for tok in result["naive_tokens"]:
        print(f"  {tok!r}")

    split_words = [t for t in result["real_tokens"] if t.startswith("##")]
    print(
        f"\nReal tokenizer produced {result['real_token_count']} tokens vs "
        f"{result['naive_token_count']} naive whitespace tokens — "
        f"{len(split_words)} continuation piece(s) ({', '.join(split_words)}) show "
        f"where a single word got split into multiple subword tokens."
    )


if __name__ == "__main__":
    main()
