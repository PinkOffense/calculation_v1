import { formatCurrency } from '../../utils';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

export function AnimatedCurrency({ value }: { value: number }) {
  const animated = useAnimatedValue(value);
  return <>{formatCurrency(animated)}</>;
}
