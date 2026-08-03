package io.shopverse.labs;

import java.util.*;
import java.util.concurrent.TimeUnit;
import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;

@BenchmarkMode(Mode.AverageTime) @OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5) @Measurement(iterations = 5) @Fork(3)
@State(Scope.Thread)
public class CollectionBenchmark {
    @Param({"1000", "100000"}) int size;
    ArrayList<Integer> array; LinkedList<Integer> linked;
    @Setup public void setup() { array = new ArrayList<>(size); linked = new LinkedList<>(); for (int i=0;i<size;i++){array.add(i);linked.add(i);} }
    @Benchmark public void iterateArray(Blackhole bh) { for (Integer value : array) bh.consume(value); }
    @Benchmark public void iterateLinked(Blackhole bh) { for (Integer value : linked) bh.consume(value); }
}
