import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, ExerciseRow } from '@/components/ui';
import { Category, EXERCISES } from '@/data/exercises';
import { Region, REGIONS, regionsOf } from '@/data/regions';
import { useStore } from '@/store';
import { colors, type } from '@/theme';

export default function Library() {
  const insets = useSafeAreaInsets();
  const { t } = useStore();
  // body regions first (arms, shoulders, core, legs, upper, lower), then the kinds of training that aren't a region
  type Filter = 'all' | Region | Extract<Category, 'combo' | 'cardio' | 'mobility'>;
  const FILTERS: Filter[] = ['all', ...REGIONS, 'combo', 'cardio', 'mobility'];
  const [cat, setCat] = useState<Filter>('all');
  const data =
    cat === 'all' ? EXERCISES
    : (REGIONS as string[]).includes(cat) ? EXERCISES.filter((e) => regionsOf(e.id).includes(cat as Region))
    : EXERCISES.filter((e) => e.category === cat);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: 16, gap: 2 }}>
        <Text style={type.eyebrow}>{data.length} {t('exercises')}</Text>
        <Text style={type.hero}>{t('library')}</Text>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 14 }}>
          {FILTERS.map((c) => (
            <Chip key={c} label={t(c)} active={cat === c} onPress={() => setCat(c)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={data}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 10 }}
        renderItem={({ item }) => <ExerciseRow ex={item} onPress={() => router.push(`/exercise/${item.id}`)} />}
      />
    </View>
  );
}
