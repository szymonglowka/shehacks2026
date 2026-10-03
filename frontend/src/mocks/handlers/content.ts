import { http, HttpResponse } from "msw";

interface Article {
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  mode: string;
  reading_minutes: number;
  cover_emoji: string;
}

const SOURCES = `
## Źródła

- WHO, *Postnatal care for mothers and newborns*
- NHS, *Your postnatal care*
- ACOG, *Postpartum care patient resources*
- pacjent.gov.pl, *Opieka okołoporodowa*
`;

function art(
  slug: string,
  title: string,
  summary: string,
  body: string,
  category: string,
  mode: string,
  reading_minutes: number,
  cover_emoji: string,
): Article {
  return { slug, title, summary, body: `${body}\n${SOURCES}`, category, mode, reading_minutes, cover_emoji };
}

const articles: Article[] = [
  art(
    "baby-blues-a-depresja",
    "Baby blues a depresja poporodowa — jak je odróżnić",
    "Smutek w pierwszych dniach po porodzie jest częsty. Podpowiadamy, na co zwrócić uwagę i kiedy porozmawiać ze specjalistą.",
    `## Smutek, który mija\n\nPierwsze dni po porodzie to huśtawka: wzruszenie, zmęczenie, łzy bez powodu. U większości mam tzw. baby blues mija samoistnie w ciągu dwóch tygodni. Spałaś 3 godziny. To nie jest porażka, to jest noworodek.\n\n## Kiedy to coś więcej\n\nJeśli smutek nie słabnie po dwóch tygodniach, trudno Ci się cieszyć czymkolwiek albo masz poczucie, że sobie nie radzisz — warto porozmawiać ze specjalistą. To nie diagnoza, tylko troska o siebie.\n\n## Co możesz zrobić już dziś\n\nOpowiedz o tym jednej osobie. Zapisz objawy i pokaż je położnej na wizycie — pomoże Ci w tym raport z Otuli.`,
    "mental_health",
    "postpartum",
    5,
    "🌅",
  ),
  art(
    "sen-z-noworodkiem",
    "Sen z noworodkiem: jak wykroić odpoczynek",
    "Nie „wyśpij się na zapas” — konkretne sposoby na sen w kawałkach.",
    `## Sen w kawałkach też działa\n\nNoworodek nie zna dnia i nocy, więc Ty też przez chwilę nie musisz. Kluczem jest spanie wtedy, gdy śpi dziecko — choćby na 40 minut. Kawa znowu wystygła? Normalka.\n\n## Zmiany z drugą osobą\n\nJeśli masz obok kogoś bliskiego, podzielcie noc na dwie warty. Jedna dłuższa, nieprzerwana drzemka robi więcej niż trzy płytkie.\n\n## Kiedy sen nie przychodzi\n\nLeżenie z zamkniętymi oczami i spokojnym oddechem to też odpoczynek. Jeśli bezsenność nie mija mimo zmęczenia, porozmawiaj o tym z położną.`,
    "sleep",
    "postpartum",
    4,
    "🌙",
  ),
  art(
    "dno-miednicy-podstawy",
    "Dno miednicy po porodzie — spokojny początek",
    "Delikatne ćwiczenia, które możesz zacząć, gdy poczujesz się gotowa.",
    `## Najpierw oddech\n\nZacznij od spokojnego oddechu przeponowego: wdech nosem, długi wydech ustami. To budzi mięśnie dna miednicy bez wysiłku.\n\n## Pierwsze napięcia\n\nGdy rana się goi i czujesz się lepiej, dodaj krótkie, delikatne napięcia — jakbyś chciała zatrzymać strumień moczu. Kilka powtórzeń dziennie wystarczy.\n\n> Przed ćwiczeniami skonsultuj się z lekarzem lub fizjoterapeutką uroginekologiczną.`,
    "movement",
    "postpartum",
    4,
    "🌿",
  ),
  art(
    "powrot-po-cesarce",
    "Powrót do siebie po cesarskim cięciu",
    "Goienie rany, pierwsze spacery i cierpliwość dla własnego ciała.",
    `## Rana potrzebuje czasu\n\nPrzez pierwsze tygodnie unikaj dźwigania i gwałtownych ruchów. Ból, który narasta zamiast słabnąć, skonsultuj z lekarzem.\n\n## Ruch krok po kroku\n\nZacznij od krótkich spacerów po domu, potem po okolicy. Twoje tempo jest dobre — nie musisz dziś niczego naprawiać.\n\n> Każdą aktywność po cesarskim cięciu skonsultuj z lekarzem lub fizjoterapeutką.`,
    "postpartum_recovery",
    "postpartum",
    6,
    "🤍",
  ),
  art(
    "rozstep-miesnia-prostego",
    "Rozejście mięśnia prostego brzucha (DRA)",
    "Czym jest rozejście kresy białej i kiedy zgłosić się do fizjoterapeutki.",
    `## Skąd ta „rynienka” na brzuchu\n\nW ciąży mięśnie proste rozchodzą się na boki. U wielu kobiet schodzą się same, u części zostaje rozejście wymagające rehabilitacji.\n\n## Czego unikać\n\nKlasyczne brzuszki i wstawanie „na wprost” zwiększają ciśnienie na kresę. Wstawaj bokiem i nie ćwicz na siłę.\n\n> Ocenę rozejścia zostaw fizjoterapeutce uroginekologicznej — pokaże Ci bezpieczne ćwiczenia.`,
    "postpartum_recovery",
    "postpartum",
    5,
    "🌾",
  ),
  art(
    "karmienie-a-nastroj",
    "Karmienie piersią a nastrój mamy",
    "Hormony, zmęczenie i presja — jak zadbać o siebie, karmiąc.",
    `## Karmienie to też wysiłek\n\nOksytocyna uspokaja, ale zmęczenie i ból brodawek potrafią odebrać radość z karmienia. Masz prawo czuć wszystko naraz.\n\n## Poproś o pomoc wcześniej\n\nDoradczyni laktacyjna pomoże z przystawieniem, a bliscy z resztą: posiłkiem, praniem, spacerem z maluchem po karmieniu.\n\n## Twoje uczucia są ważne\n\nTrudne emocje przy karmieniu nie świadczą o Tobie jako mamie. Jeśli nie mijają, porozmawiaj ze specjalistą.`,
    "breastfeeding",
    "postpartum",
    5,
    "🤱",
  ),
  art(
    "powrot-miesiaczki-po-porodzie",
    "Powrót miesiączki po porodzie",
    "Kiedy wraca okres, czym się różni i kiedy Otula przełączy tryb.",
    `## Kiedy się spodziewać\n\nPrzy karmieniu piersią okres wraca zwykle później, przy karmieniu butelką — wcześniej. Rozpiętość jest ogromna i to normalne.\n\n## Pierwsze cykle bywają dziwne\n\nNieregularne, obfitsze albo skąpe. Zapisuj je w kalendarzu — po kilku cyklach zobaczysz swój rytm.\n\n## Przełączenie trybu\n\nGdy wróci miesiączka, daj znać w kalendarzu — Otula płynnie przejdzie w tryb cyklu, a Twoja historia zostanie z Tobą.`,
    "cycle",
    "postpartum",
    3,
    "🗓️",
  ),
  art(
    "nastroj-a-cykl",
    "Nastrój a cykl — co się dzieje w każdej fazie",
    "Faza folikularna, owulacja, lutealna: jak hormony wpływają na samopoczucie.",
    `## To nie fanaberia\n\nWahania nastroju w cyklu mają podłoże hormonalne. Obserwacja własnych faz pomaga przestać się sobie dziwić.\n\n## Faza lutealna bywa najtrudniejsza\n\nSpadek energii i drażliwość przed okresem zna wiele kobiet. Zaplanuj wtedy mniej i odpuść jedną rzecz z listy.\n\n## Twój raport\n\nOtula pokaże Ci średni nastrój w każdej fazie — to wskazówka, nie wyrocznia.`,
    "cycle",
    "cycle",
    5,
    "🌗",
  ),
  art(
    "pms-pmdd",
    "PMS i PMDD — kiedy napięcie przedmiesiączkowe to za dużo",
    "Różnica między PMS a PMDD i co zapisać przed wizytą u lekarza.",
    `## PMS zna wiele z nas\n\nTkliwość piersi, rozdrażnienie, ochota na słone. Zwykle słabnie z pierwszym dniem krwawienia.\n\n## PMDD to inna skala\n\nGdy przed okresem regularnie pojawia się silny smutek, lęk albo wybuchy złości, które utrudniają życie — to może być PMDD. Zapisz objawy z 2–3 cykli i pokaż je lekarzowi.\n\n## Nie musisz tego przeczekiwać\n\nSą skuteczne sposoby pomocy, od stylu życia po leczenie. Pierwszy krok to nazwa dla tego, co czujesz.`,
    "mental_health",
    "cycle",
    5,
    "🌧️",
  ),
  art(
    "jak-prosic-o-pomoc",
    "Jak prosić o pomoc, gdy proszenie jest trudne",
    "Konkretne zdania i sposoby, które zdejmują ciężar z proszenia.",
    `## „Daj znać, jak coś” nie działa\n\nLudzie chcą pomóc, ale nie wiedzą jak. Konkretna prośba — „przynieś obiad w czwartek” — to ulga dla obu stron.\n\n## Gotowe zdania\n\n„Czy możesz dziś przejąć wieczorne karmienie?” „Zabierzesz starszaka na plac na godzinę?” Skopiuj, wyślij, odłóż telefon.\n\n## Krąg w Otuli\n\nListę próśb możesz zebrać w Kręgu wsparcia i wysłać bliskim jeden link. Bez tłumaczenia się dwa razy.`,
    "relationships",
    "both",
    4,
    "💌",
  ),
  art(
    "jak-wspierac-mame",
    "Jak wspierać mamę po porodzie — przewodnik dla bliskich",
    "Praktyczny poradnik dla partnera, babci i przyjaciół: co robić, czego nie mówić.",
    `## Rób, nie pytaj\n\nZamiast „daj znać, jak coś” — ugotuj, posprzątaj łazienkę, wyjdź ze starszym dzieckiem. Konkret wygrywa z deklaracjami.\n\n## Czego nie mówić\n\n„Inne dają radę”, „wyśpij się na zapas”, „korzystaj, póki śpi”. Zastąp je: „świetnie sobie radzisz”, „jestem tu”, „odpocznij, ja go ponoszę”.\n\n## Zwróć uwagę na sygnały\n\nSmutek dłuższy niż dwa tygodnie, wycofanie, lęk — delikatnie zaproponuj rozmowę ze specjalistą. Twoje wsparcie ma znaczenie.`,
    "relationships",
    "both",
    6,
    "🫶",
  ),
  art(
    "delikatny-ruch",
    "Delikatny ruch, który nie wymaga stroju sportowego",
    "Spacer, rozciąganie i powrót do ciała bez presji.",
    `## Zacznij od 5 minut\n\nKrótki spacer w Twoim tempie liczy się tak samo jak trening. Świeże powietrze rozluźnia ciało i myśli.\n\n## Słuchaj ciała, nie planu\n\nBól to sygnał stop, nie do zagryzienia zębów. Gorszy dzień to dzień na odpoczynek, nie na rekordy.\n\n> Po porodzie każdą aktywność skonsultuj z lekarzem lub fizjoterapeutką.`,
    "movement",
    "both",
    4,
    "🚶",
  ),
  art(
    "odzywianie-po-porodzie",
    "Jedzenie, gdy nie ma czasu jeść",
    "Proste sposoby na regularne posiłki jedną ręką.",
    `## Jedz, nie gotuj (na razie)\n\nPostaw na rzeczy do zjedzenia jedną ręką: orzechy, jogurt, owoce, kanapki przygotowane wieczorem. Regularność ważniejsza niż ideał.\n\n## Woda w zasięgu ręki\n\nButelka przy miejscu karmienia to najprostszy nawyk. Odwodnienie pogłębia zmęczenie.\n\n## Bez restrykcji\n\nTo nie czas na diety. Jeśli martwisz się apetytem albo wagą, porozmawiaj z położną lub dietetykiem.`,
    "nutrition",
    "postpartum",
    4,
    "🍲",
  ),
  art(
    "kotwica-5-4-3-2-1",
    "Kotwica 5-4-3-2-1 na trudne chwile",
    "Technika uziemienia, gdy lęk narasta: pięć zmysłów, kilka minut.",
    `## Jak to działa\n\nWymień: 5 rzeczy, które widzisz, 4, które słyszysz, 3, które czujesz dotykiem, 2 zapachy i 1 smak. Uwaga wraca do tu i teraz.\n\n## Kiedy sięgać\n\nGdy myśli pędzą, serce wali, a ręce się trzęsą. Możesz robić to z dzieckiem na rękach — nikt nie zauważy.\n\n## To początek, nie całość\n\nUziemienie łagodzi objaw. Jeśli lęk wraca często, porozmawiaj ze specjalistą — zasługujesz na więcej spokoju.`,
    "mental_health",
    "both",
    3,
    "⚓",
  ),
  art(
    "natrętne-myśli",
    "Natrętne myśli po porodzie — nie jesteś złą mamą",
    "Skąd biorą się niechciane myśli o krzywdzie dziecka i kiedy szukać pomocy.",
    `## To częstsze, niż myślisz\n\nWiele mam miewa nagłe, niechciane obrazy, że dziecku dzieje się krzywda. Same myśli nie czynią Cię złą mamą i zwykle mijają.\n\n## Co pomaga\n\nNazwanie ich („to natrętna myśl, nie fakt”), sen, rozmowa z kimś zaufanym. Nie walcz z nimi na siłę.\n\n## Kiedy pilnie po pomoc\n\nJeśli myśli przeradzają się w chęć skrzywdzenia siebie lub dziecka, zadzwoń pod 112 lub na telefon zaufania — natychmiast, bez wstydu.`,
    "mental_health",
    "postpartum",
    5,
    "🕊️",
  ),
  art(
    "wspolczucie-dla-siebie",
    "Dobre słowo dla siebie — samowspółczucie bez lukru",
    "Jak mówić do siebie jak do przyjaciółki, nie jak do podwładnej.",
    `## Złap ton\n\n„Znowu mi nie wyszło” zamień na: „To był trudny dzień. Robię, co mogę.” Brzmi dziwnie? Z czasem mniej.\n\n## Wspólne człowieczeństwo\n\nNie jesteś jedyna, której wystygła kawa i która płakała w łazience. Tysiące mam robi dziś to samo.\n\n## Mała praktyka\n\nPołóż dłoń na sercu, weź oddech i powiedz jedno życzliwe zdanie. Nie musisz dziś niczego naprawiać.`,
    "mental_health",
    "both",
    3,
    "💛",
  ),
];

const specialists = [
  { id: 1, name: "Anna Kowalczyk", specialty: "midwife", city: "Kraków", online: true, phone: "+48 600 100 200", website: null, description: "Położna środowiskowa, wizyty domowe i wsparcie laktacyjne.", is_sample: true },
  { id: 2, name: "Maria Zielińska", specialty: "physiotherapist", city: "Warszawa", online: false, phone: "+48 600 100 201", website: null, description: "Fizjoterapeutka uroginekologiczna, praca po porodzie i przy DRA.", is_sample: true },
  { id: 3, name: "Katarzyna Nowak", specialty: "psychologist", city: "Online", online: true, phone: null, website: "https://przyklad.pl/k-nowak", description: "Psycholożka okołoporodowa, baby blues i trudne emocje.", is_sample: true },
  { id: 4, name: "Agnieszka Wiśniewska", specialty: "psychiatrist", city: "Gdańsk", online: true, phone: "+48 600 100 203", website: null, description: "Psychiatra, diagnostyka i leczenie depresji poporodowej.", is_sample: true },
  { id: 5, name: "Ewa Lewandowska", specialty: "lactation", city: "Wrocław", online: true, phone: "+48 600 100 204", website: null, description: "Doradczyni laktacyjna CDL, karmienie bez bólu.", is_sample: true },
  { id: 6, name: "Magdalena Wójcik", specialty: "psychologist", city: "Poznań", online: false, phone: "+48 600 100 205", website: null, description: "Psycholożka, terapia poznawczo-behawioralna dla mam.", is_sample: true },
  { id: 7, name: "Joanna Kamińska", specialty: "midwife", city: "Katowice", online: false, phone: "+48 600 100 206", website: null, description: "Położna, szkoły rodzenia i wizyty patronażowe.", is_sample: true },
  { id: 8, name: "Natalia Piotrowska", specialty: "physiotherapist", city: "Online", online: true, phone: null, website: "https://przyklad.pl/n-piotrowska", description: "Fizjoterapeutka uroginekologiczna, konsultacje online.", is_sample: true },
  { id: 9, name: "Paulina Szymańska", specialty: "psychiatrist", city: "Kraków", online: false, phone: "+48 600 100 208", website: null, description: "Psychiatra, farmakoterapia zgodna z karmieniem piersią.", is_sample: true },
  { id: 10, name: "Karolina Dąbrowska", specialty: "lactation", city: "Łódź", online: true, phone: "+48 600 100 209", website: null, description: "Doradczyni laktacyjna, odciąganie i powrót do pracy.", is_sample: true },
];

export const handlers = [
  http.get("/api/v1/articles", ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const mode = url.searchParams.get("mode");
    let list = articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      category: a.category,
      mode: a.mode,
      reading_minutes: a.reading_minutes,
      cover_emoji: a.cover_emoji,
    }));
    if (category) list = list.filter((a) => a.category === category);
    if (mode) list = list.filter((a) => a.mode === mode || a.mode === "both");
    return HttpResponse.json(list);
  }),
  http.get("/api/v1/articles/:slug", ({ params }) => {
    const article = articles.find((a) => a.slug === params.slug);
    if (!article) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    return HttpResponse.json(article);
  }),
  http.get("/api/v1/specialists", ({ request }) => {
    const url = new URL(request.url);
    const specialty = url.searchParams.get("specialty");
    const city = url.searchParams.get("city");
    const online = url.searchParams.get("online");
    let list = specialists;
    if (specialty) list = list.filter((s) => s.specialty === specialty);
    if (city) list = list.filter((s) => s.city === city);
    if (online !== null && online !== undefined && online !== "") {
      list = list.filter((s) => s.online === (online === "true"));
    }
    return HttpResponse.json(list);
  }),
];
