import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  let websiteName = 'SATYAM';
  try {
    const { supabaseServer } = await import('@/utils/supabaseServer');
    const { data } = await supabaseServer
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'brand')
      .single();
    if (data?.setting_value?.websiteName) {
      websiteName = data.setting_value.websiteName;
    }
  } catch (error) {
    // fallback
  }

  return {
    title: `Login | ${websiteName} Admin Portal`,
    description: 'Secure login for institute admission management staff.',
    robots: { index: false, follow: false },
  };
}
