package io.shopverse.labs;

import java.util.concurrent.RecursiveTask;

public final class ForkJoinSumLab extends RecursiveTask<Long> {
    private final long[] values; private final int from, to, threshold;
    public ForkJoinSumLab(long[] values, int from, int to, int threshold) { this.values=values;this.from=from;this.to=to;this.threshold=threshold; }
    @Override protected Long compute() {
        if (to-from <= threshold) { long sum=0; for(int i=from;i<to;i++)sum+=values[i]; return sum; }
        int mid=(from+to)>>>1; var left=new ForkJoinSumLab(values,from,mid,threshold); left.fork();
        return new ForkJoinSumLab(values,mid,to,threshold).compute()+left.join();
    }
}
