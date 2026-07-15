import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, FlatList } from 'react-native';

import { BackButton } from '@/components/auth/back-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

type DuaaItem = {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  category: 'knowledge' | 'anxiety' | 'success' | 'morning';
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
    category: 'success',
    title: 'Duaa for Deciding the Right Choice (Istikhara)',
    arabic: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ',
    transliteration: 'Allahumma inni astakhiruka bi’ilmika wa astaqdiruka biqudratika wa as’aluka min fadlikal-’azheem',
    translation: 'O Allah, I seek Your counsel through Your knowledge, and I seek Your assistance through Your might, and I ask You of Your immense favor.',
    reference: 'Sahih al-Bukhari',
  },
  {
    id: '5',
    category: 'morning',
    title: 'Morning Supplication for Protection',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: 'Bismillahil-ladhi la yadurru ma’as-mihi shai’un fil-ardi wa la fis-sama’i, wa Huwas-Sami’ul-’Alim',
    translation: 'In the Name of Allah with Whose Name nothing can cause harm in the earth or in the heaven, and He is the All-Hearing, the All-Knowing.',
    reference: 'Sunan Abi Dawud',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Duaas', icon: 'apps-outline' },
  { id: 'knowledge', label: 'Knowledge', icon: 'book-outline' },
  { id: 'anxiety', label: 'Anxiety', icon: 'heart-outline' },
  { id: 'success', label: 'Success', icon: 'trophy-outline' },
  { id: 'morning', label: 'Daily / Morning', icon: 'sunny-outline' },
];

export default function IslamicDuaaScreen() {
  const theme = useAuthTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredDuaas = DUAAS.filter((duaa) => {
    const matchesSearch =
      duaa.title.toLowerCase().includes(search.toLowerCase()) ||
      duaa.translation.toLowerCase().includes(search.toLowerCase()) ||
      duaa.transliteration.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || duaa.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <ScreenContainer>
      <BackButton fallbackHref="/home" />

      <View style={styles.headerRow}>
        <View style={[styles.iconBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="book" size={28} color={theme.primary} />
        </View>
        <View>
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

      {/* Horizontal categories list */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.id;
            return (
              <Pressable
                onPress={() => setSelectedCategory(item.id)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color={isActive ? theme.buttonText : theme.secondary}
                />
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isActive ? theme.buttonText : theme.text,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {/* Supplication items list */}
      <FlatList
        data={filteredDuaas}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={theme.secondary} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No supplications found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.duaaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.duaaTitle, { color: theme.primary }]}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: theme.inputBackground }]}>
                <Text style={[styles.badgeText, { color: theme.secondary }]}>{item.category}</Text>
              </View>
            </View>

            <Text style={[styles.arabicText, { color: theme.text }]}>{item.arabic}</Text>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.transliterationText, { color: theme.secondary }]}>
              "{item.transliteration}"
            </Text>

            <Text style={[styles.translationText, { color: theme.text }]}>
              {item.translation}
            </Text>

            <Text style={[styles.referenceText, { color: theme.textMuted }]}>
              — {item.reference}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />
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
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.body - 1,
    height: '100%',
  },
  categoriesWrapper: {
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: Typography.caption + 1,
  },
  listContainer: {
    paddingBottom: Spacing.xl * 2,
    gap: Spacing.md,
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
    fontSize: Typography.body,
    fontWeight: '800',
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: Typography.caption - 1,
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
