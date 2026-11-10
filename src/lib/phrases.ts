/**
 * Spoken prompts for the worker flow. `ur` is shown and read by an Urdu voice; `hi` is the same
 * sentence in Devanagari for devices that only have a Hindi voice (spoken Hindi/Urdu are mutually
 * intelligible, so the worker still hears natural speech); `en` is used when the UI is in English.
 */
export const P = {
  welcome: {
    ur: "روشن روزگار میں خوش آمدید۔ اپنا موبائل نمبر دبائیں، پھر سبز بٹن دبائیں۔",
    hi: "रोशन रोज़गार में ख़ुश आमदीद। अपना मोबाइल नंबर दबाइए, फिर हरा बटन दबाइए।",
    en: "Welcome to Roshan Rozgar. Tap your mobile number, then press the green button.",
  },
  code: {
    ur: "آپ کے فون پر کوڈ آ گیا ہے۔ سبز بٹن دبائیں۔",
    hi: "आपके फ़ोन पर कोड आ गया है। हरा बटन दबाइए।",
    en: "The code has arrived on your phone. Press the green button.",
  },
  speak: {
    ur: "مائیک دبائیں اور بولیں: آپ کا نام، آپ کیا کام کرتے ہیں، کتنے سال کا تجربہ ہے، کس علاقے میں ہیں، اور آنے کی فیس کتنی ہے۔ بات ختم ہو تو دوبارہ دبائیں۔",
    hi: "माइक दबाइए और बोलिए: आपका नाम, आप क्या काम करते हैं, कितने साल का तजुर्बा है, किस इलाक़े में हैं, और आने की फ़ीस कितनी है। बात ख़त्म हो तो दोबारा दबाइए।",
    en: "Press the mic and tell us your name, what work you do, how many years of experience you have, your area, and your visit fee. Press again when you finish.",
  },
  example: {
    ur: "میرا نام اسلم ہے، میں بجلی کا کام کرتا ہوں، پندرہ سال تجربہ ہے، جی نائن میں رہتا ہوں، آنے کا پانچ سو روپے لیتا ہوں۔",
    hi: "मेरा नाम असलम है, मैं बिजली का काम करता हूँ, पंद्रह साल तजुर्बा है, जी नाइन में रहता हूँ, आने का पाँच सौ रुपये लेता हूँ।",
    en: "My name is Aslam, I do electrical work, I have fifteen years of experience, I live in G-9, and I charge five hundred rupees for a visit.",
  },
  thinking: { ur: "آپ کی بات سمجھی جا رہی ہے…", hi: "आपकी बात समझी जा रही है…", en: "Understanding what you said…" },
  review: {
    ur: "یہ آپ کی پروفائل ہے۔ کوئی چیز غلط ہو تو اس خانے کو دبا کر ٹھیک کریں۔ سب ٹھیک ہے تو سبز بٹن دبائیں۔",
    hi: "यह आपकी प्रोफ़ाइल है। कोई चीज़ ग़लत हो तो उस ख़ाने को दबा कर ठीक करें। सब ठीक है तो हरा बटन दबाइए।",
    en: "This is your profile. If something is wrong, tap that box to fix it. If everything is right, press the green button.",
  },
  missing: {
    ur: "یہ معلومات باقی ہے۔ اس خانے کو دبائیں۔",
    hi: "यह जानकारी बाक़ी है। इस ख़ाने को दबाइए।",
    en: "This is missing. Tap this box.",
  },
  photo: {
    ur: "اپنی تصویر کھینچیں تاکہ گاہک آپ کو پہچان سکے۔ یا بغیر تصویر کے آگے بڑھیں۔",
    hi: "अपनी तस्वीर खींचिए ताकि गाहक आपको पहचान सके। या बिना तस्वीर के आगे बढ़िए।",
    en: "Take your photo so customers can recognise you. Or continue without a photo.",
  },
  online: {
    ur: "آپ کام کے لیے تیار ہیں۔ نیا کام آئے گا تو گھنٹی بجے گی۔",
    hi: "आप काम के लिए तैयार हैं। नया काम आएगा तो घंटी बजेगी।",
    en: "You are ready for work. A bell will ring when a new job arrives.",
  },
  offline: {
    ur: "آپ ابھی بند ہیں۔ کام لینے کے لیے سبز بٹن دبائیں۔",
    hi: "आप अभी बंद हैं। काम लेने के लिए हरा बटन दबाइए।",
    en: "You are offline. Press the button to start getting jobs.",
  },
  busy: {
    ur: "آپ ابھی ایک کام پر ہیں۔ کام ختم ہو تو کام مکمل کا بٹن دبائیں۔",
    hi: "आप अभी एक काम पर हैं। काम ख़त्म हो तो काम मुकम्मल का बटन दबाइए।",
    en: "You are on a job. When you finish, press the job done button.",
  },
  thread: {
    ur: "مائیک دبا کر گاہک سے بات کریں۔ قیمت بدلنے کے لیے جمع اور منفی کے بٹن دبائیں، پھر قیمت بھیجیں۔",
    hi: "माइक दबा कर गाहक से बात करें। क़ीमत बदलने के लिए प्लस और माइनस के बटन दबाइए, फिर क़ीमत भेजिए।",
    en: "Press the mic to talk to the customer. Use the plus and minus buttons to change the price, then send it.",
  },
} as const;

/** One sentence describing the profile, for the "read my profile" button. */
export function profileSentence(
  lang: "en" | "ur",
  p: { name: string; tradeUr: string | null; tradeEn: string | null; years: number | null; areaUr: string | null; areaEn: string | null; fee: number | null },
): string {
  const parts =
    lang === "ur"
      ? [
          p.name ? `آپ کا نام ${p.name} ہے۔` : "",
          p.tradeUr ? `آپ کا کام ${p.tradeUr} ہے۔` : "",
          p.years != null ? `${p.years} سال کا تجربہ۔` : "",
          p.areaUr ? `علاقہ ${p.areaUr}۔` : "",
          p.fee != null ? `آنے کی فیس ${p.fee} روپے۔` : "",
        ]
      : [
          p.name ? `Your name is ${p.name}.` : "",
          p.tradeEn ? `You are an ${p.tradeEn}.`.replace(/an ([^AEIOU])/, "a $1") : "",
          p.years != null ? `${p.years} years of experience.` : "",
          p.areaEn ? `Area ${p.areaEn}.` : "",
          p.fee != null ? `Visit fee ${p.fee} rupees.` : "",
        ];
  return parts.filter(Boolean).join(" ");
}
