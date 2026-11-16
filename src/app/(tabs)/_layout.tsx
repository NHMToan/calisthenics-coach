import { NativeTabs } from 'expo-router/native-tabs';
import { useStore } from '@/store';
import { colors, fonts } from '@/theme';

export default function TabLayout() {
  const { t } = useStore();
  return (
    <NativeTabs
      tintColor={colors.accent}
      iconColor={{ default: colors.muted, selected: colors.accent }}
      labelStyle={{ default: { fontFamily: fonts.semi, fontSize: 11, color: colors.muted }, selected: { fontFamily: fonts.bold, fontSize: 11, color: colors.accent } }}
      backgroundColor={colors.bg}
      blurEffect="systemChromeMaterialDark"
      indicatorColor={'rgba(198,244,50,0.16)'}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('today')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="figure.strengthtraining.functional" md="fitness_center" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Label>{t('library')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>{t('progress')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t('settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
