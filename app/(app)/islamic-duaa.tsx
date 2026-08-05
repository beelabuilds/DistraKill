import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { BackButton } from '@/components/auth/back-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';


export type DuaaItem = {
  id: string;
  category: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
};

export type EmotionCategory = {
  id: string;
  label: string;
  desc: string;
};

export const EMOTIONS: EmotionCategory[] = [
  { id: 'anxiety', label: 'Anxious / Worried', desc: 'Find calm & peace in distress' },
  { id: 'stress', label: 'Stressed / Overwhelmed', desc: 'Duaas for relief & trust' },
  { id: 'knowledge', label: 'Unfocused / Studying', desc: 'Duaas for memory & focus' },
  { id: 'grief', label: 'Sad / Grieving', desc: 'Ease sorrow & find comfort' },
  { id: 'gratitude', label: 'Grateful / Thankful', desc: 'Thanking Allah for blessings' },
  { id: 'patience', label: 'Need Patience / Sabr', desc: 'Strength to endure hardships' },
  { id: 'daily', label: 'Daily Protection', desc: 'Morning & evening safety' },
];

export const DUAAS: DuaaItem[] = [
  // ==========================================
  // 1. KNOWLEDGE (10 items)
  // ==========================================
  {
    id: 'k1',
    category: 'knowledge',
    title: 'Supplication for Knowledge',
    arabic: 'رَّبِّ زِدْنِي عِلْمًا',
    transliteration: 'Rabbi zidnee ‘ilmaa',
    translation: 'My Lord, increase me in knowledge.',
    reference: 'Surah Taha [20:114]',
  },
  {
    id: 'k2',
    category: 'knowledge',
    title: 'Duaa for Easing Tasks & Speech',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي',
    transliteration: 'Rabbi-shrah lee sadree, wa yassir lee amree, wahlul ‘uqdatan min lisaanee, yafqahoo qawlee',
    translation: 'My Lord, expand for me my breast [with assurance] and ease for me my task and untie the knot from my tongue that they may understand my speech.',
    reference: 'Surah Taha [20:25-28]',
  },
  {
    id: 'k3',
    category: 'knowledge',
    title: 'Duaa for Beneficial Knowledge & Provision',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا',
    transliteration: 'Allahumma innee as’aluka ‘ilman naafi‘an, wa rizqan tayyiban, wa ‘amalan mutaqabbalaa',
    translation: 'O Allah, I ask You for beneficial knowledge, good provision, and deeds that are accepted.',
    reference: 'Sunan Ibn Majah',
  },
  {
    id: 'k4',
    category: 'knowledge',
    title: 'Duaa to Benefit from Learned Knowledge',
    arabic: 'اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي وَزِدْنِي عِلْمًا',
    transliteration: 'Allahumman-fa‘nee bimaa ‘allamtanee wa ‘allimnee maa yanfa‘unee wa zidnee ‘ilmaa',
    translation: 'O Allah, benefit me with what You have taught me, teach me what will benefit me, and increase me in knowledge.',
    reference: 'Sunan at-Tirmidhi',
  },
  {
    id: 'k5',
    category: 'knowledge',
    title: 'Duaa for Understanding the Religion and Wisdom',
    arabic: 'اللَّهُمَّ فَقِّهْنِي فِي الدِّينِ وَعَلِّمْنِي التَّأْوِيلَ',
    transliteration: 'Allahumma faqqihnee fid-deeni wa ‘allimnit-ta’weel',
    translation: 'O Allah, give me deep understanding of the religion and teach me the interpretation of wisdom.',
    reference: 'Sahih al-Bukhari & Sahih Muslim',
  },
  {
    id: 'k6',
    category: 'knowledge',
    title: 'Duaa for Seeking Guidance and Piety in Learning',
    arabic: 'اللَّهُمَّ آتِ نَفْسِي تَقْوَاهَا وَزَكِّهَا أَنْتَ خَيْرُ مَنْ زَكَّاهَا أَنْتَ وَلِيُّهَا وَمَوْلَاهَا',
    transliteration: 'Allahumma aati nafsee taqwaahaa wa zakkihaa Anta khayru man zakkaahaa, Anta Waliyyuhaa wa Mawlaahaa',
    translation: 'O Allah, grant my soul its piety and purify it, You are the Best to purify it. You are its Guardian and Master.',
    reference: 'Sahih Muslim',
  },
  {
    id: 'k7',
    category: 'knowledge',
    title: 'Duaa Seeking Refuge from Useless Knowledge',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لَا يَنْفَعُ وَمِنْ قَلْبٍ لَا يَخْشَعُ وَمِنْ نَفْسٍ لَا تَشْبَعُ وَمِنْ دَعْوَةٍ لَا يُسْتَجَابُ لَهَا',
    transliteration: 'Allahumma innee a‘oodhu bika min ‘ilmin laa yanfa‘, wa min qalbin laa yakhsha‘, wa min nafsin laa tashba‘, wa min da‘watin laa yustajaabu lahaa',
    translation: 'O Allah, I seek refuge in You from knowledge that does not benefit, a heart that does not humble itself, a soul that is never satisfied, and a supplication that is not answered.',
    reference: 'Sahih Muslim',
  },
  {
    id: 'k8',
    category: 'knowledge',
    title: 'Duaa for Wisdom and Righteous Companionship',
    arabic: 'رَبِّ هَبْ لِي حُكْمًا وَأَلْحِقْنِي بِالصَّالِحِينَ',
    transliteration: 'Rabbi hab lee hukmanw-wa alhiqnee bis-saaliheen',
    translation: 'My Lord, grant me authority and wisdom and join me with the righteous.',
    reference: 'Surah Ash-Shu‘ara [26:83]',
  },
  {
    id: 'k9',
    category: 'knowledge',
    title: 'Duaa for Guidance and Right Speech',
    arabic: 'اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي',
    transliteration: 'Allahummahdinee wa saddidnee',
    translation: 'O Allah, guide me and keep me upon the straight path.',
    reference: 'Sahih Muslim',
  },
  {
    id: 'k10',
    category: 'knowledge',
    title: 'Duaa for Expansion of the Heart in Truth',
    arabic: 'أَفَمَن شَرَحَ اللَّهُ صَدْرَهُ لِلْإِسْلَامِ فَهُوَ عَلَىٰ نُورٍ مِّن رَّبِّهِ',
    transliteration: 'Afaman sharahallahu sadrahoo lil-Islaami fahuwa ‘alaa noorin mir-Rabbih',
    translation: 'So is one whose breast Allah has expanded to [accept] Islam and he is upon a light from his Lord [like one whose heart is hard]?',
    reference: 'Surah Az-Zumar [39:22]',
  },

  // ==========================================
  // 2. ANXIETY (10 items)
  // ==========================================
  {
    id: 'a1',
    category: 'anxiety',
    title: 'Duaa for Anxiety and Distress',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْبُخْلِ وَالْجُبْنِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    transliteration: 'Allahumma inni a’udhu bika minal-hammi wal-hazani, wal-’ajzi wal-kasali, wal-bukhli wal-jubni, wa dala’id-dayni wa ghalabatir-rijal',
    translation: 'O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.',
    reference: 'Sahih al-Bukhari',
  },
  {
    id: 'a2',
    category: 'anxiety',
    title: 'Duaa of Prophet Yunus (In Adversity)',
    arabic: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
    transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin',
    translation: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
    reference: 'Surah Al-Anbya [21:87]',
  },
  {
    id: 'a3',
    category: 'anxiety',
    title: 'Duaa for Immediate Relief in Hardship',
    arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    transliteration: 'Yaa Hayyu yaa Qayyoomu birahmatika astagheeth',
    translation: 'O Ever-Living One, O Self-Sustaining One, in Your mercy I seek relief.',
    reference: 'Sunan at-Tirmidhi',
  },
  {
    id: 'a4',
    category: 'anxiety',
    title: 'Duaa for Complete Trust and Peace of Mind',
    arabic: 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ وَأَصْلِحْ لِي شَأْنِي كُلَّهُ لَا إِلَهَ إِلَّا أَنْتَ',
    transliteration: 'Allahumma rahmataka arjoo falaa takilnee ilaa nafsee tarfata ‘aynin, wa aslih lee sha’nee kullahu, laa ilaaha illa Ant',
    translation: 'O Allah, it is Your mercy that I hope for, so do not leave me to myself even for the blink of an eye, and set right all my affairs. There is no deity except You.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: 'a5',
    category: 'anxiety',
    title: 'Duaa for Severe Distress and Overwhelming Thoughts',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
    transliteration: 'Laa ilaaha illallaahul-‘Adheemul-Haleem, laa ilaaha illallaahu Rabbul-‘Arshil-‘Adheem, laa ilaaha illallaahu Rabbus-samaawaati wa Rabbul-ardi wa Rabbul-‘Arshil-Kareem',
    translation: 'There is no deity except Allah, the Magnificent, the Forbearing. There is no deity except Allah, Lord of the Magnificent Throne. There is no deity except Allah, Lord of the heavens and Lord of the earth and Lord of the Noble Throne.',
    reference: 'Sahih al-Bukhari & Sahih Muslim',
  },
  {
    id: 'a6',
    category: 'anxiety',
    title: 'Duaa for Panic and Sudden Fear',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ وَشَرِّ عِبَادِهِ وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ',
    transliteration: 'A‘oodhu bikalimaatillaahit-taammaati min ghadabihi wa ‘iqaabihi wa sharri ‘ibaadihi wa min hamazaatish-shayaateeni wa an yahduroon',
    translation: 'I seek refuge in the perfect words of Allah from His anger and punishment, from the evil of His servants, and from the whisperings of devils and that they should be present with me.',
    reference: 'Sunan at-Tirmidhi',
  },
  {
    id: 'a7',
    category: 'anxiety',
    title: 'Duaa for Protection from Fear and Concealment of Faults',
    arabic: 'اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي',
    transliteration: 'Allahummastur ‘awraatee wa aamin raw‘aatee',
    translation: 'O Allah, conceal my faults and calm my fears.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: 'a8',
    category: 'anxiety',
    title: 'Duaa when Heart is Disturbed or wavering',
    arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ',
    transliteration: 'Yaa Muqallibal-quloobi thabbit qalbee ‘alaa deenik',
    translation: 'O Turner of the hearts, make my heart firm upon Your religion.',
    reference: 'Sunan at-Tirmidhi',
  },
  {
    id: 'a9',
    category: 'anxiety',
    title: 'Duaa for Absolute Sufficiency in Allah',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: 'Hasbunallahu wa ni‘mal-wakeel',
    translation: 'Sufficient for us is Allah, and He is the best Disposer of affairs.',
    reference: 'Surah Ali ‘Imran [3:173]',
  },
  {
    id: 'a10',
    category: 'anxiety',
    title: 'Duaa for Calmness and Peace of Heart',
    arabic: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    transliteration: 'Alladheena aamanoo wa tatma’innu quloobuhum bidhikrillaah, alaa bidhikrillaahi tatma’innul-quloob',
    translation: 'Those who have believed and whose hearts find rest in the remembrance of Allah. Unquestionably, by the remembrance of Allah do hearts find rest.',
    reference: 'Surah Ar-Ra‘d [13:28]',
  },

  // ==========================================
  // 3. STRESS (10 items)
  // ==========================================
  {
    id: 's1',
    category: 'stress',
    title: 'Duaa for Relief from Difficulties',
    arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
    transliteration: 'Allahumma la sahla illa ma ja’altahu sahla, wa anta taj’alul-hazna idha shi’ta sahla',
    translation: 'O Allah, there is no ease except in that which You have made easy, and You make the difficulty easy, if You will.',
    reference: 'Sahih Ibn Hibban',
  },
  {
    id: 's2',
    category: 'stress',
    title: 'Duaa for Trust in Allah',
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ ۖ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    transliteration: 'Hasbiyallahu la ilaha illa Huwa, ‘alayhi tawakkaltu, wa Huwa Rabbul-’Arshil-’Azheem',
    translation: 'Sufficient for me is Allah; there is no deity except Him. On Him I have relied, and He is the Lord of the Great Throne.',
    reference: 'Surah At-Tawbah [9:129]',
  },
  {
    id: 's3',
    category: 'stress',
    title: 'Duaa when Complaining of Heartache to Allah',
    arabic: 'إِنَّمَا أَشْكُو بَثِّي وَحُزْنِي إِلَى اللَّهِ',
    transliteration: 'Innamaa ashkoo bathee wa huznee ilallaah',
    translation: 'I only complain of my suffering and my grief to Allah.',
    reference: 'Surah Yusuf [12:86]',
  },
  {
    id: 's4',
    category: 'stress',
    title: 'Duaa for Entrusting Affairs to Allah',
    arabic: 'وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ ۚ إِنَّ اللَّهَ بَصِيرٌ بِالْعِبَادِ',
    transliteration: 'Wa ufawwidu amree ilallaah, innallaaha baseerum-bil-‘ibaad',
    translation: 'And I entrust my affair to Allah. Indeed, Allah is Seeing of [His] servants.',
    reference: 'Surah Ghafir [40:44]',
  },
  {
    id: 's5',
    category: 'stress',
    title: 'Duaa for Seeking Divine Guidance in Hard Times',
    arabic: 'رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا',
    transliteration: 'Rabbanaa aatinaa min ladunka rahmatanw-wa hayyi’ lanaa min amrinaa rashadaa',
    translation: 'Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.',
    reference: 'Surah Al-Kahf [18:10]',
  },
  {
    id: 's6',
    category: 'stress',
    title: 'Duaa for Physical & Mental Strength',
    arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ',
    transliteration: 'Allahumma ‘aafinee fee badanee, Allahumma ‘aafinee fee sam‘ee, Allahumma ‘aafinee fee basaree, laa ilaaha illa Ant',
    translation: 'O Allah, grant well-being to my body; O Allah, grant well-being to my hearing; O Allah, grant well-being to my sight. There is no deity except You.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: 's7',
    category: 'stress',
    title: 'Duaa Seeking Victory and Support',
    arabic: 'اللَّهُمَّ أَنْتَ عَضُدِي وَأَنْتَ نَصِيرِي، بِكَ أَجُولُ وَبِكَ أَصُولُ وَبِكَ أُقَاتِلُ',
    transliteration: 'Allahumma Anta ‘adudee wa Anta naseeree, bika ajoolu wa bika asoolu wa bika uqaatil',
    translation: 'O Allah, You are my support and You are my helper. By Your help I move, by Your help I attack, and by Your help I fight.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: 's8',
    category: 'stress',
    title: 'Duaa for Deliverance from Oppressive Pressure',
    arabic: 'رَبِّ نَجِّنِي مِنَ الْقَوْمِ الظَّالِمِينَ',
    transliteration: 'Rabbi najjinee minal-qawmiz-zaalimeen',
    translation: 'My Lord, save me from the wrongdoing people.',
    reference: 'Surah Al-Qasas [28:21]',
  },
  {
    id: 's9',
    category: 'stress',
    title: 'Duaa for Protection from Overwhelming Burdens',
    arabic: 'رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا',
    transliteration: 'Rabbanaa wa laa tuhammilnaa maa laa taaqata lanaa bih, wa‘fu ‘annaa waghfir lanaa warhamnaa',
    translation: 'Our Lord, and lay not upon us a burden greater than we have strength to bear. And pardon us; and forgive us; and have mercy upon us.',
    reference: 'Surah Al-Baqarah [2:286]',
  },
  {
    id: 's10',
    category: 'stress',
    title: 'Duaa for Guidance when Making Decisions under Pressure',
    arabic: 'اللَّهُمَّ خِرْ لِي وَاخْتَرْ لِي',
    transliteration: 'Allahumma khir lee wakhtar lee',
    translation: 'O Allah, make a good choice for me and select for me what is best.',
    reference: 'Sunan at-Tirmidhi',
  },

  // ==========================================
  // 4. GRIEF (10 items)
  // ==========================================
  {
    id: 'g1',
    category: 'grief',
    title: 'Duaa of Prophet Ayyub (In Distress)',
    arabic: 'أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ',
    transliteration: 'An-nee massaniyad-durru wa-Anta Arhamur-Raahimeen',
    translation: 'Indeed, adversity has touched me, and you are the Most Merciful of the merciful.',
    reference: 'Surah Al-Anbya [21:83]',
  },
  {
    id: 'g2',
    category: 'grief',
    title: 'Duaa for Comfort in Sorrow',
    arabic: 'اللَّهُمَّ إِنِّي عَبْدُكَ، وَابْنُ عَبْدِكَ، وَابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ',
    transliteration: 'Allahumma inni ‘abduk, wa-bnu ‘abdik, wa-bnu amatik, nasiyati biya-dik, madin fiyya hukmuk, ‘adlun fiyya qada’uk',
    translation: 'O Allah, I am Your servant, son of Your servant, son of Your maidservant; my forelock is in Your hand. Your command over me is forever executed and Your decree over me is just.',
    reference: 'Musnad Ahmad',
  },
  {
    id: 'g3',
    category: 'grief',
    title: 'Duaa Upon Suffering Calamity or Loss',
    arabic: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا',
    transliteration: 'Innaa lillaahi wa innaa ilayhi raaji‘oon, Allahumm-ajurnee fee museebatee wa akhlif lee khayram-minhaa',
    translation: 'Indeed we belong to Allah and indeed to Him we will return. O Allah, reward me in my affliction and replace it with something better for me.',
    reference: 'Sahih Muslim',
  },
  {
    id: 'g4',
    category: 'grief',
    title: 'Duaa when Feeling Helpless and Destitute',
    arabic: 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
    transliteration: 'Rabbi innee limaa anzalta ilayya min khayrin faqeer',
    translation: 'My Lord, indeed I am, for whatever good You would send down to me, in need.',
    reference: 'Surah Al-Qasas [28:24]',
  },
  {
    id: 'g5',
    category: 'grief',
    title: 'Duaa for Beautiful Patience in Heartbreak',
    arabic: 'فَصَبْرٌ جَمِيلٌ ۖ وَاللَّهُ الْمُسْتَعَانُ عَلَىٰ مَا تَصِفُونَ',
    transliteration: 'Fa-sabrun jameelun wallahul-musta‘aanu ‘alaa maa tasifoon',
    translation: 'So patience is most fitting, and Allah is the One sought for help against that which you describe.',
    reference: 'Surah Yusuf [12:18]',
  },
  {
    id: 'g6',
    category: 'grief',
    title: 'Duaa to Make the Quran the Delight of the Heart',
    arabic: 'اللَّهُمَّ اجْعَلِ الْقُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجَلَاءَ حُزْنِي، وَذَهَابَ هَمِّي',
    transliteration: 'Allahummaj-‘alil-Qur’aana rabee‘a qalbee, wa noora sadree, wa jalaa’a huznee, wa dhahaaba hammee',
    translation: 'O Allah, make the Qur’an the spring of my heart, the light of my chest, the banisher of my sadness, and the reliever of my distress.',
    reference: 'Musnad Ahmad',
  },
  {
    id: 'g7',
    category: 'grief',
    title: 'Duaa for Divine Mercy During Loss',
    arabic: 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
    transliteration: 'Rabbanaa dhalamnaa anfusanaa wa illam taghfir lanaa wa tarhamnaa lanakoonanna minal-khaasireen',
    translation: 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.',
    reference: 'Surah Al-A‘raf [7:23]',
  },
  {
    id: 'g8',
    category: 'grief',
    title: 'Duaa for Forgiveness & Relief for Deceased Loved Ones',
    arabic: 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ وَأَكْرِمْ نُزُلَهُ',
    transliteration: 'Allahummaghfir lahoo warhamhu wa ‘aafihi wa‘fu ‘anhu wa akrim nuzulahu',
    translation: 'O Allah, forgive him and have mercy on him, keep him safe and sound and pardon him, and make his resting place honorable.',
    reference: 'Sahih Muslim',
  },
  {
    id: 'g9',
    category: 'grief',
    title: 'Duaa for Healing a Broken Spirit',
    arabic: 'اللَّهُمَّ اجْبُرْ كَسْرِي وَارْحَمْ ضَعْفِي وَاهْدِنِي لِصَالِحِ الْأَعْمَالِ',
    transliteration: 'Allahummajbur kasree warham da‘fee wahdinee lisaalihil-a‘maal',
    translation: 'O Allah, mend my brokenness, have mercy on my weakness, and guide me to righteous deeds.',
    reference: 'Sunan at-Tirmidhi',
  },
  {
    id: 'g10',
    category: 'grief',
    title: 'Duaa for Seeking Peace in Times of Despair',
    arabic: 'اللَّهُمَّ لَا تُؤْمِنِّي مَكْرَكَ، وَلَا تُنْسِنِي ذِكْرَكَ، وَلَا تَجْعَلْنِي مِنَ الْغَافِلِينَ',
    transliteration: 'Allahumma laa tu’minnee makraka wa laa tunseenee dhikraka wa laa taj‘alnee minal-ghaafileen',
    translation: 'O Allah, do not leave me feeling unprotected from Your plan, do not make me forget Your remembrance, and do not make me among the heedless.',
    reference: 'Al-Adab al-Mufrad (Bukhari)',
  },

  // ==========================================
  // 5. GRATITUDE (10 items)
  // ==========================================
  {
    id: 'gt1',
    category: 'gratitude',
    title: 'Duaa to Express Gratitude',
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَى دِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    transliteration: 'Allahumma a’innee ‘ala dhikrika wa shukrika wa husni ‘ibadatik',
    translation: 'O Allah, help me remember You, express gratitude to You, and worship You in the best manner.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: 'gt2',
    category: 'gratitude',
    title: 'Duaa of Prophet Sulaiman for Gratitude',
    arabic: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَدْخِلْنِي بِرَحْمَتِكَ فِي عِبَادِكَ الصَّالِحِينَ',
    transliteration: 'Rabbi awzi‘nee an ashkura ni‘matakal-latee an‘amta ‘alayya wa ‘alaa waalidayya wa an a‘mala saalihan tardaahu wa adkhilnee birahmatika fee ‘ibaadikas-saaliheen',
    translation: 'My Lord, enable me to be grateful for Your favor which You have bestowed upon me and upon my parents and to do righteousness of which You approve and admit me by Your mercy among Your righteous servants.',
    reference: 'Surah An-Naml [27:19]',
  },
  {
    id: 'gt3',
    category: 'gratitude',
    title: 'Duaa After Finishing a Meal or Receiving Provision',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
    transliteration: 'Alhamdulillaahil-ladhee at‘amanaa wa saqaanaa wa ja‘alanaa muslimeen',
    translation: 'Praise be to Allah Who has fed us and given us drink and made us Muslims.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: 'gt4',
    category: 'gratitude',
    title: 'Comprehensive Praise to Allah',
    arabic: 'الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ',
    transliteration: 'Alhamdulillaahi hamdan katheeran tayyiban mubaarakan feeh',
    translation: 'Praise be to Allah, abundant, good, and blessed praise.',
    reference: 'Sahih al-Bukhari',
  },
  {
    id: 'gt5',
    category: 'gratitude',
    title: 'Duaa for Lifelong Blessings and Righteous Offspring',
    arabic: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَصْلِحْ لِي فِي ذُرِّيَّتِي',
    transliteration: 'Rabbi awzi‘nee an ashkura ni‘matakal-latee an‘amta ‘alayya wa ‘alaa waalidayya wa an a‘mala saalihan tardaahu wa aslih lee fee dhurriyyatee',
    translation: 'My Lord, enable me to be grateful for Your favor which You have bestowed upon me and upon my parents and to work righteousness of which You approve and make righteous for me my offspring.',
    reference: 'Surah Al-Ahqaf [46:15]',
  },
  {
    id: 'gt6',
    category: 'gratitude',
    title: 'Morning Supplication of Gratitude',
    arabic: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
    transliteration: 'Allahumma maa asbaha bee min ni‘matin aw bi-ahadin min khalqika faminka wahdaka laa shareeka laka, falakal-hamdu wa lakash-shukr',
    translation: 'O Allah, whatever blessing has reached me or any of Your creation this morning is from You alone, without partner. To You belongs all praise and to You belongs all thanks.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: 'gt7',
    category: 'gratitude',
    title: 'Duaa Upon Seeing Good News or Success',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ',
    transliteration: 'Alhamdulillaahil-ladhee bini‘matihi tatimmus-saalihaat',
    translation: 'Praise be to Allah by Whose favor good works are accomplished.',
    reference: 'Sunan Ibn Majah',
  },
  {
    id: 'gt8',
    category: 'gratitude',
    title: 'Duaa Acknowledging Divine Favors and Forgiveness',
    arabic: 'أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration: 'Aboo’u laka bini‘matika ‘alayya wa aboo’u bidhanbee faghfir lee fa-innahoo laa yaghfirudh-dhunooba illa Ant',
    translation: 'I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.',
    reference: 'Sahih al-Bukhari',
  },
  {
    id: 'gt9',
    category: 'gratitude',
    title: 'Duaa for Allah’s Countless Blessings',
    arabic: 'وَإِن تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا ۗ إِنَّ اللَّهَ لَغَفُورٌ رَّحِيمٌ',
    transliteration: 'Wa in ta‘uddoo ni‘matallaahi laa tuhsoohaa, innallaaha laghafoorur-raheem',
    translation: 'And if you should count the favors of Allah, you could not enumerate them. Indeed, Allah is Forgiving and Merciful.',
    reference: 'Surah An-Nahl [16:18]',
  },
  {
    id: 'gt10',
    category: 'gratitude',
    title: 'Praise for Safety and Divine Provision',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي كَفَانَا وَأَرْوَانَا غَيْرَ مَكْفِيٍّ وَلَا مَكْفُورٍ',
    transliteration: 'Alhamdulillaahil-ladhee kafaanaa wa arwaanaa ghayra makfiyyin wa laa makfoor',
    translation: 'Praise be to Allah Who has satisfied us and quenched our thirst, unceasingly and ungratefully praised.',
    reference: 'Sahih al-Bukhari',
  },

  // ==========================================
  // 6. PATIENCE / SABR (10 items)
  // ==========================================
  {
    id: 'p1',
    category: 'patience',
    title: 'Duaa for Patience and Sabr',
    arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ',
    transliteration: 'Rabbana afrigh ‘alayna sabran wa tawaffana muslimeen',
    translation: 'Our Lord, pour upon us patience and let us die as Muslims [in submission to You].',
    reference: 'Surah Al-A’raf [7:126]',
  },
  {
    id: 'p2',
    category: 'patience',
    title: 'Duaa for Firmness Against Trials',
    arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
    transliteration: 'Rabbanaa afrigh ‘alaynaa sabranw-wa thabbit aqdaamanaa wansurnaa ‘alal-qawmil-kaafireen',
    translation: 'Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.',
    reference: 'Surah Al-Baqarah [2:250]',
  },
  {
    id: 'p3',
    category: 'patience',
    title: 'Duaa for Steadfast Heart and Protection from Deviation',
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ',
    transliteration: 'Rabbanaa laa tuzigh quloobanaa ba‘da idh hadaytanaa wa hab lanaa min ladunka rahmatan innaka Antal-Wahhaab',
    translation: 'Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.',
    reference: 'Surah Ali ‘Imran [3:8]',
  },
  {
    id: 'p4',
    category: 'patience',
    title: 'Duaa Seeking Determination and Steadfastness',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الثَّبَاتَ فِي الْأَمْرِ، وَالْعَزِيمَةَ عَلَى الرُّشْدِ',
    transliteration: 'Allahumma innee as’alukat-thabaata fil-amri wal-‘azeemata ‘alar-rushd',
    translation: 'O Allah, I ask You for steadfastness in all my affairs and determination in following right guidance.',
    reference: 'Sunan an-Nasa’i',
  },
  {
    id: 'p5',
    category: 'patience',
    title: 'Duaa for Divine Support in Endurance',
    arabic: 'اللَّهُمَّ أَعِنِّي وَلَا تُعِنْ عَلَيَّ، وَانْصُرْنِي وَلَا تَنْصُرْ عَلَيَّ، وَامْكُرْ لِي وَلَا تَمْكُرْ عَلَيَّ',
    transliteration: 'Allahumma a‘innee wa laa tu‘in ‘alayya, wansurnee wa laa tansur ‘alayya, wamkur lee wa laa tamkur ‘alay',
    translation: 'O Allah, help me and do not help others against me; grant me victory and do not grant victory to others over me; plan for me and do not plan against me.',
    reference: 'Sunan at-Tirmidhi',
  },
  {
    id: 'p6',
    category: 'patience',
    title: 'Duaa for Contentment with Allah’s Decree',
    arabic: 'اللَّهُمَّ رَضِّنِي بِقَضَائِكَ، وَبَارِكْ لِي فِيمَا قُدِّرَ لِي، حَتَّى لَا أُحِبَّ تعْجِيلَ مَا أَخَّرْتَ وَلَا تَأْخِيرَ مَا عَجَّلْتَ',
    transliteration: 'Allahumma raddinee biqadaa’ika wa baarik lee feemaa quddira lee hattaa laa uhibba ta‘jeela maa akhkharta wa laa ta’kheera maa ‘ajjalt',
    translation: 'O Allah, make me content with Your decree and bless me in what has been destined for me so that I do not desire to hasten what You have delayed or delay what You have hastened.',
    reference: 'Sunan at-Tirmidhi',
  },
  {
    id: 'p7',
    category: 'patience',
    title: 'Duaa when Facing Oppression or Hostility',
    arabic: 'اللَّهُمَّ اكْفِنِيهِمْ بِمَا شِئْتَ',
    transliteration: 'Allahumm-akfineehim bimaa shi’t',
    translation: 'O Allah, protect me against them in whatever way You will.',
    reference: 'Sahih Muslim',
  },
  {
    id: 'p8',
    category: 'patience',
    title: 'Duaa Asking for Forgiveness and Steadfastness in Conflict',
    arabic: 'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
    transliteration: 'Rabbanagh-fir lanaa dhunoobanaa wa israafanaa fee amrinaa wa thabbit aqdaamanaa wansurnaa ‘alal-qawmil-kaafireen',
    translation: 'Our Lord, forgive us our sins and the excess in our affairs, plant firmly our feet, and give us victory over the disbelieving people.',
    reference: 'Surah Ali ‘Imran [3:147]',
  },
  {
    id: 'p9',
    category: 'patience',
    title: 'Duaa of Prophet Musa when Seeking Direction',
    arabic: 'عَسَىٰ رَبِّي أَن يَهْدِيَنِي سَوَاءَ السَّبِيلِ',
    transliteration: '‘Asaa Rabbee ay-yahdiyanee sawaa’as-sabeel',
    translation: 'Perhaps my Lord will guide me to the sound way.',
    reference: 'Surah Al-Qasas [28:22]',
  },
  {
    id: 'p10',
    category: 'patience',
    title: 'Remembrance that Victory comes with Patience',
    arabic: 'وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ ۚ وَلَا تَحْزَنْ عَلَيْهِمْ وَلَا تَكُ فِي ضَيْقٍ مِّمَّا يَمْكُرُونَ',
    transliteration: 'Wasbir wa maa sabruka illaa billaah, wa laa tahzan ‘alayhim wa laa taku fee dayqim-mimmaa yamkuroon',
    translation: 'And be patient, and your patience is not but through Allah. And do not grieve over them and do not be in distress over what they conspire.',
    reference: 'Surah An-Nahl [16:127]',
  },

  // ==========================================
  // 7. DAILY PROTECTION (10 items)
  // ==========================================
  {
    id: 'd1',
    category: 'daily',
    title: 'Morning Supplication for Protection',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: 'Bismillahil-ladhi la yadurru ma’as-mihi shai’un fil-ardi wa la fis-sama’i, wa Huwas-Sami’ul-’Alim',
    translation: 'In the Name of Allah with Whose Name nothing can cause harm in the earth or in the heaven, and He is the All-Hearing, the All-Knowing.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: 'd2',
    category: 'daily',
    title: 'Sayyidul Istighfar (The Master Supplication for Forgiveness)',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ',
    transliteration: 'Allahumma Anta Rabbee laa ilaaha illa Ant, khalaqtanee wa ana ‘abduk, wa ana ‘alaa ‘ahdika wa wa‘dika mastata‘tu, a‘oodhu bika min sharri maa sana‘t',
    translation: 'O Allah, You are my Lord; there is no deity except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done.',
    reference: 'Sahih al-Bukhari',
  },
  {
    id: 'd3',
    category: 'daily',
    title: 'Duaa for Refuge in Allah’s Perfect Words',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: 'A‘oodhu bikalimaatillaahit-taammaati min sharri maa khalaq',
    translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    reference: 'Sahih Muslim',
  },
  {
    id: 'd4',
    category: 'daily',
    title: 'Duaa Upon Leaving the Home',
    arabic: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'Bismillaahi, tawakkaltu ‘alallaah, wa laa hawla wa laa quwwata illaa billaah',
    translation: 'In the name of Allah, I place my trust in Allah; there is no power and no strength except through Allah.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: 'd5',
    category: 'daily',
    title: 'Duaa Upon Entering the Home',
    arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
    transliteration: 'Bismillaahi walajnaa, wa bismillaahi kharajnaa, wa ‘alallaahi Rabbinaa tawakkalnaa',
    translation: 'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we place our trust.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: 'd6',
    category: 'daily',
    title: 'Comprehensive Protection for Life, Family & Wealth',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي',
    transliteration: 'Allahumma innee as’alukal-‘afwa wal-‘aafiyata fid-dunyaa wal-aakhirah, Allahumma innee as’alukal-‘afwa wal-‘aafiyata fee deenee wa dunyaaya wa ahlee wa maalee',
    translation: 'O Allah, I ask You for forgiveness and well-being in this world and the Hereafter. O Allah, I ask You for forgiveness and well-being in my religion, my worldly affairs, my family, and my wealth.',
    reference: 'Sunan Abi Dawud & Sunan Ibn Majah',
  },
  {
    id: 'd7',
    category: 'daily',
    title: 'Morning Declaration of Faith & Sovereignty',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    transliteration: 'Asbahnaa wa asbahal-mulku lillaahi wal-hamdu lillaah, laa ilaaha illallaahu wahdahoo laa shareeka lah',
    translation: 'We have entered the morning and the kingdom belongs to Allah, all praise is due to Allah. There is no deity except Allah alone, without partner.',
    reference: 'Sahih Muslim',
  },
  {
    id: 'd8',
    category: 'daily',
    title: 'Supplication Before Sleeping',
    arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
    transliteration: 'Bismika Rabbee wada‘tu janbee wa bika arfa‘uh, in amsakta nafsee farhamhaa, wa in arsaltahaa fahfadhhaa bimaa tahfadhu bihi ‘ibaadakas-saaliheen',
    translation: 'In Your name, my Lord, I lay down my side and in Your name I raise it up. If You take my soul, have mercy on it, and if You send it back, protect it as You protect Your righteous servants.',
    reference: 'Sahih al-Bukhari & Sahih Muslim',
  },
  {
    id: 'd9',
    category: 'daily',
    title: 'Supplication Upon Waking Up',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: 'Alhamdulillaahil-ladhee ahyaanaa ba‘da maa amaatanaa wa ilaihin-nushoor',
    translation: 'Praise be to Allah Who brought us to life after causing us to die, and to Him is the resurrection.',
    reference: 'Sahih al-Bukhari',
  },
  {
    id: 'd10',
    category: 'daily',
    title: 'Supplication for Protection Against Evil Eye & Harm',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ',
    transliteration: 'A‘oodhu bikalimaatillaahit-taammati min kulli shaytaaninw-wa haammatinw-wa min kulli ‘aynin laammah',
    translation: 'I seek refuge in the perfect words of Allah from every devil and poisonous reptile, and from every evil eye.',
    reference: 'Sahih al-Bukhari',
  },
];

export default function IslamicDuaaScreen() {
  const theme = useAuthTheme();
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const selectedEmotion = EMOTIONS.find((e) => e.id === selectedCategoryId);

  // Perform search query filtering
  const searchResults = search.trim()
    ? DUAAS.filter((duaa) => {
      return (
        duaa.title.toLowerCase().includes(search.toLowerCase()) ||
        duaa.translation.toLowerCase().includes(search.toLowerCase()) ||
        duaa.transliteration.toLowerCase().includes(search.toLowerCase())
      );
    })
    : [];

  const categoryDuaas = selectedCategoryId
    ? DUAAS.filter((d) => d.category === selectedCategoryId)
    : [];


  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (text.trim() && selectedCategoryId) {
      setSelectedCategoryId(null);
    }
  };

  return (
    <ScreenContainer scrollable>
      {selectedCategoryId ? (
        <Pressable
          onPress={() => setSelectedCategoryId(null)}
          style={styles.categoryBackButton}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>All Categories</Text>
        </Pressable>
      ) : (
        <BackButton fallbackHref="/home" />
      )}

      <View style={styles.headerRow}>
        <View style={[styles.iconBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="book" size={28} color={theme.primary} />
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            {selectedEmotion ? selectedEmotion.label : 'Islamic Duaa Library'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {selectedEmotion ? selectedEmotion.desc : 'Supplications for memory, focus, and calm.'}
          </Text>
        </View>
      </View>

      {/* Search Box */}
      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.secondary} />
        <TextInput
          placeholder="Search prayers, translation..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={handleSearchChange}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.secondary} />
          </Pressable>
        ) : null}
      </View>

      {search.trim() ? (
        // Render Search Results directly
        <View style={styles.resultsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Search Results ({searchResults.length})
          </Text>
          {searchResults.map((item) => (
            <View key={item.id} style={[styles.duaaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.duaaTitle, { color: theme.primary }]}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: theme.inputBackground }]}>
                  <Text style={[styles.badgeText, { color: theme.secondary }]}>{item.category}</Text>
                </View>
              </View>

              <Text style={[styles.arabicText, { color: theme.text }]}>{item.arabic}</Text>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <Text style={[styles.transliterationText, { color: theme.secondary }]}>
                {"\"" + item.transliteration + "\""}
              </Text>

              <Text style={[styles.translationText, { color: theme.text }]}>
                {item.translation}
              </Text>

              <Text style={[styles.referenceText, { color: theme.textMuted }]}>
                — {item.reference}
              </Text>
            </View>
          ))}
          {searchResults.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={theme.secondary} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No supplications found.</Text>
            </View>
          )}
        </View>
      ) :
        selectedCategoryId ? (
          <View style={styles.resultsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Supplications ({categoryDuaas.length})
            </Text>
            {categoryDuaas.map((duaa) => (
              <View key={duaa.id} style={[styles.duaaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.duaaTitle, { color: theme.primary }]}>{duaa.title}</Text>

                <Text style={[styles.arabicText, { color: theme.text }]}>{duaa.arabic}</Text>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <Text style={[styles.transliterationText, { color: theme.secondary }]}>
                  {'"' + duaa.transliteration + '"'}
                </Text>

                <Text style={[styles.translationText, { color: theme.text }]}>
                  {duaa.translation}
                </Text>

                <Text style={[styles.referenceText, { color: theme.textMuted }]}>
                  — {duaa.reference}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          // Render Expandable List of Emotions
          <View style={styles.emotionsListContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>How are you feeling today?</Text>

            {EMOTIONS.map((emotion) => {
              const count = DUAAS.filter(
                (d) => d.category === emotion.id
              ).length;

              return (
                <Pressable
                  key={emotion.id}
                  onPress={() => setSelectedCategoryId(emotion.id)}
                  style={({ pressed }) => [
                    styles.emotionCardWrapper,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={styles.emotionHeader}>
                    <View style={styles.emotionInfo}>
                      <Text style={[styles.emotionLabel, { color: theme.text }]}>{emotion.label}</Text>
                      <Text style={[styles.emotionDesc, { color: theme.textMuted }]}>{emotion.desc}</Text>
                    </View>
                    <View style={styles.rightHeaderContainer}>
                      <View style={[styles.countBadge, { backgroundColor: theme.surfaceSoft }]}>
                        <Text style={[styles.countText, { color: theme.secondary }]}>
                          {count} {count === 1 ? 'Duaa' : 'Duaas'}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={theme.secondary}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
    </ScreenContainer >
  );
}

const styles = StyleSheet.create({
  categoryBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  backText: {
    fontSize: Typography.body - 1,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
    borderWidth: 1.5,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.title,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.caption + 1,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.body - 1,
    height: '100%',
  },
  sectionTitle: {
    fontSize: Typography.body + 1,
    fontWeight: '800',
    marginBottom: Spacing.sm + 2,
    letterSpacing: -0.3,
  },

  // Expandable Emotion cards
  emotionsListContainer: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  emotionCardWrapper: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activeCardWrapper: {
    borderWidth: 1.5,
  },
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emotionIconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionInfo: {
    flex: 1,
    gap: 2,
  },
  emotionLabel: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
  },
  emotionDesc: {
    fontSize: Typography.caption + 1,
  },
  rightHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Accordion Duaas display
  accordionContent: {
    borderTopWidth: 1,
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  duaaBlock: {
    gap: Spacing.sm,
  },
  duaaBlockTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
  },
  blockDivider: {
    height: 1,
    width: '100%',
    marginBottom: Spacing.md,
    opacity: 0.5,
  },

  // Search Results & Duaa Card
  resultsContainer: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  duaaCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  duaaTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: Typography.caption - 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  arabicText: {
    fontSize: Typography.title,
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 40,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  transliterationText: {
    fontSize: Typography.caption + 1,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  translationText: {
    fontSize: Typography.body - 1,
    lineHeight: 20,
  },
  referenceText: {
    fontSize: Typography.caption,
    textAlign: 'right',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.body - 1,
  },
});
