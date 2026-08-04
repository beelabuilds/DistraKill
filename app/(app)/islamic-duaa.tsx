import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

import { BackButton } from '@/components/auth/back-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type DuaaItem = {
  id: string;
  category: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
};

const DUAAS: DuaaItem[] = [
  {
    id: '1',
    category: 'knowledge',
    title: 'Supplication for Knowledge (Rabb-i Zidni Ilma)',
    arabic: 'رَّبِّ زِدْنِي عِلْمًا',
    transliteration: 'Rabbi zidnee ‘ilmaa',
    translation: 'My Lord, increase me in knowledge.',
    reference: 'Surah Taha [20:114]',
  },
  {
    id: '2',
    category: 'knowledge',
    title: 'Duaa for Easing Tasks & Speech',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي',
    transliteration: 'Rabbi-shrah lee sadree, wa yassir lee amree, wahlul ‘uqdatan min lisaanee, yafqahoo qawlee',
    translation: 'My Lord, expand for me my breast [with assurance] and ease for me my task and untie the knot from my tongue that they may understand my speech.',
    reference: 'Surah Taha [20:25-28]',
  },
  {
    id: '3',
    category: 'anxiety',
    title: 'Duaa for Anxiety and Distress',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْبُخْلِ وَالْجُبْنِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    transliteration: 'Allahumma inni a’udhu bika minal-hammi wal-hazani, wal-’ajzi wal-kasali, wal-bukhli wal-jubni, wa dala’id-dayni wa ghalabatir-rijal',
    translation: 'O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.',
    reference: 'Sahih al-Bukhari',
  },
  {
    id: '4',
    category: 'anxiety',
    title: 'Duaa of Prophet Yunus (In Adversity)',
    arabic: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
    transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin',
    translation: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
    reference: 'Surah Al-Anbya [21:87]',
  },
  {
    id: '5',
    category: 'stress',
    title: 'Duaa for Relief from Difficulties',
    arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
    transliteration: 'Allahumma la sahla illa ma ja’altahu sahla, wa anta taj’alul-hazna idha shi’ta sahla',
    translation: 'O Allah, there is no ease except in that which You have made easy, and You make the difficulty easy, if You will.',
    reference: 'Sahih Ibn Hibban',
  },
  {
    id: '6',
    category: 'stress',
    title: 'Duaa for Trust in Allah',
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ ۖ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    transliteration: 'Hasbiyallahu la ilaha illa Huwa, ‘alayhi tawakkaltu, wa Huwa Rabbul-’Arshil-’Azheem',
    translation: 'Sufficient for me is Allah; there is no deity except Him. On Him I have relied, and He is the Lord of the Great Throne.',
    reference: 'Surah At-Tawbah [9:129]',
  },
  {
    id: '7',
    category: 'grief',
    title: 'Duaa of Prophet Ayyub (In Distress)',
    arabic: 'أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ',
    transliteration: 'An-nee massaniyad-durru wa-Anta Arhamur-Raahimeen',
    translation: 'Indeed, adversity has touched me, and you are the Most Merciful of the merciful.',
    reference: 'Surah Al-Anbya [21:83]',
  },
  {
    id: '8',
    category: 'grief',
    title: 'Duaa for Comfort in Sorrow',
    arabic: 'اللَّهُمَّ إِنِّي عَبْدُكَ، وَابْنُ عَبْدِكَ، وَابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ',
    transliteration: 'Allahumma inni ‘abduk, wa-bnu ‘abdik, wa-bnu amatik, nasiyati biya-dik, madin fiyya hukmuk, ‘adlun fiyya qada’uk',
    translation: 'O Allah, I am Your servant, son of Your servant, son of Your maidservant; my forelock is in Your hand. Your command over me is forever executed and Your decree over me is just.',
    reference: 'Musnad Ahmad',
  },
  {
    id: '9',
    category: 'gratitude',
    title: 'Duaa to Express Gratitude',
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَى دِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    transliteration: 'Allahumma a’innee ‘ala dhikrika wa shukrika wa husni ‘ibadatik',
    translation: 'O Allah, help me remember You, express gratitude to You, and worship You in the best manner.',
    reference: 'Sunan Abi Dawud',
  },
  {
    id: '10',
    category: 'patience',
    title: 'Duaa for Patience and Sabr',
    arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ',
    transliteration: 'Rabbana afrigh ‘alayna sabran wa tawaffana muslimeen',
    translation: 'Our Lord, pour upon us patience and let us die as Muslims [in submission to You].',
    reference: 'Surah Al-A’raf [7:126]',
  },
  {
    id: '11',
    category: 'daily',
    title: 'Morning Supplication for Protection',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: 'Bismillahil-ladhi la yadurru ma’as-mihi shai’un fil-ardi wa la fis-sama’i, wa Huwas-Sami’ul-’Alim',
    translation: 'In the Name of Allah with Whose Name nothing can cause harm in the earth or in the heaven, and He is the All-Hearing, the All-Knowing.',
    reference: 'Sunan Abi Dawud',
  },
];

type EmotionCategory = {
  id: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
};

const EMOTIONS: EmotionCategory[] = [
  { id: 'anxiety', label: 'Anxious / Worried', desc: 'Find calm & peace in distress', icon: 'heart-outline', color: '#C95C56' },
  { id: 'stress', label: 'Stressed / Overwhelmed', desc: 'Duaas for relief & trust', icon: 'speedometer-outline', color: '#7893A3' },
  { id: 'knowledge', label: 'Unfocused / Studying', desc: 'Duaas for memory & focus', icon: 'book-outline', color: '#8BAAC9' },
  { id: 'grief', label: 'Sad / Grieving', desc: 'Ease sorrow & find comfort', icon: 'sad-outline', color: '#3E454D' },
  { id: 'gratitude', label: 'Grateful / Thankful', desc: 'Thanking Allah for blessings', icon: 'rose-outline', color: '#FFB03A' },
  { id: 'patience', label: 'Need Patience / Sabr', desc: 'Strength to endure hardships', icon: 'shield-checkmark-outline', color: '#7999A4' },
  { id: 'daily', label: 'Daily Protection', desc: 'Morning & evening safety', icon: 'sunny-outline', color: '#8BAAC9' },
];

export default function IslamicDuaaScreen() {
  const theme = useAuthTheme();
  const [search, setSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

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

  return (
    <ScreenContainer scrollable>
      <BackButton fallbackHref="/home" />

      <View style={styles.headerRow}>
        <View style={[styles.iconBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="book" size={28} color={theme.primary} />
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Islamic Duaa Library</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Supplications for memory, focus, and calm.
          </Text>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.secondary} />
        <TextInput
          placeholder="Search prayers, translation..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
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
      ) : (
        // Render Expandable List of Emotions
        <View style={styles.emotionsListContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>How are you feeling today?</Text>

          {EMOTIONS.map((emotion) => {
            const isExpanded = expandedCategory === emotion.id;
            const categoryDuaas = DUAAS.filter(d => d.category === emotion.id);

            return (
              <View
                key={emotion.id}
                style={[
                  styles.emotionCardWrapper,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                  isExpanded && styles.activeCardWrapper
                ]}
              >
                {/* Accordion Header */}
                <Pressable
                  onPress={() => toggleCategory(emotion.id)}
                  style={({ pressed }) => [
                    styles.emotionHeader,
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <View style={[styles.emotionIconBg, { backgroundColor: theme.inputBackground }]}>
                    <Ionicons name={emotion.icon as any} size={22} color={emotion.color} />
                  </View>
                  <View style={styles.emotionInfo}>
                    <Text style={[styles.emotionLabel, { color: theme.text }]}>{emotion.label}</Text>
                    <Text style={[styles.emotionDesc, { color: theme.textMuted }]}>{emotion.desc}</Text>
                  </View>
                  <View style={styles.rightHeaderContainer}>
                    <View style={[styles.countBadge, { backgroundColor: theme.surfaceSoft }]}>
                      <Text style={[styles.countText, { color: theme.secondary }]}>
                        {categoryDuaas.length} {categoryDuaas.length === 1 ? 'Duaa' : 'Duaas'}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={theme.secondary}
                    />
                  </View>
                </Pressable>

                {/* Accordion Content (List of Duaas) */}
                {isExpanded && (
                  <View style={[styles.accordionContent, { borderTopColor: theme.border }]}>
                    {categoryDuaas.map((duaa, idx) => (
                      <View key={duaa.id} style={styles.duaaBlock}>
                        {idx > 0 && <View style={[styles.blockDivider, { backgroundColor: theme.border }]} />}
                        <Text style={[styles.duaaBlockTitle, { color: theme.primary }]}>{duaa.title}</Text>
                        <Text style={[styles.arabicText, { color: theme.text }]}>{duaa.arabic}</Text>

                        <Text style={[styles.transliterationText, { color: theme.secondary }]}>
                          {"\"" + duaa.transliteration + "\""}
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
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
