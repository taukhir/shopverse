package io.shopverse.labs;

import java.util.Spliterator;
import java.util.function.IntConsumer;

public final class RangeSpliterator implements Spliterator.OfInt {
    private int current; private final int end;
    public RangeSpliterator(int start, int end) { current=start;this.end=end; }
    public boolean tryAdvance(IntConsumer action) { if(current>=end)return false;action.accept(current++);return true; }
    public OfInt trySplit() { int remaining=end-current;if(remaining<2)return null;int mid=current+remaining/2;var split=new RangeSpliterator(current,mid);current=mid;return split; }
    public long estimateSize() { return end-current; }
    public int characteristics() { return ORDERED|SIZED|SUBSIZED|IMMUTABLE|NONNULL; }
}
