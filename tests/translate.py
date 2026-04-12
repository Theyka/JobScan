import requests


def translate(text: str, to: str = "en", src: str = "auto", host: str = "translate.google.com", proxy: str = None) -> dict:
    url = f"https://{host}/translate_a/single?client=at&dt=t&dt=rm&dj=1"
    proxies = {"http": proxy, "https": proxy} if proxy else None
    res = requests.post(
        url,
        data={"sl": src, "tl": to, "q": text},
        headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
        proxies=proxies,
    )
    res.raise_for_status()
    raw = res.json()
    translated = "".join(s["trans"] for s in raw["sentences"] if "trans" in s)
    return {"text": translated, "raw": raw}


if __name__ == "__main__":
    result = translate("""Biznes strukturlardan daxil olan tələblər əsasında SQL sorğularının yazılması;

Yeni və mövcud hesabatların performansının optimallaşdırılması;

Yeni layihələrdə cədvəl strukturları üçün ER Diaqramlarının qurulması və rəylərin verilməsi;

Komanda yoldaşlarına dəstək və tövsiyyələrin verilməsi.""", to="en")
    print(result["text"])
