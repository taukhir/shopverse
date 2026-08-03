package io.shopverse.labs;

import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;
import org.openjdk.jmh.annotations.*;

@BenchmarkMode(Mode.AverageTime) @OutputTimeUnit(TimeUnit.MILLISECONDS)
@Warmup(iterations=3) @Measurement(iterations=5) @Fork(2) @State(Scope.Thread)
public class ParallelStreamBenchmark {
    @Param({"1000","1000000"}) int size;
    @Benchmark public long sequential() { return IntStream.range(0,size).map(ParallelStreamBenchmark::work).asLongStream().sum(); }
    @Benchmark public long parallel() { return IntStream.range(0,size).parallel().map(ParallelStreamBenchmark::work).asLongStream().sum(); }
    private static int work(int value) { int x=value; for(int i=0;i<20;i++)x=Integer.rotateLeft(x*31+17,3);return x; }
}
