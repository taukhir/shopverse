package io.shopverse.labs;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public final class ThreadPoolSaturationLab {
    public record Result(int accepted, int rejected, int largestPool, int queued) {}

    public static Result run(int tasks) throws InterruptedException {
        AtomicInteger rejected = new AtomicInteger();
        ThreadPoolExecutor pool = new ThreadPoolExecutor(2, 4, 1, TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(4), Thread.ofPlatform().name("bounded-", 0).factory(),
                (task, executor) -> { rejected.incrementAndGet(); throw new RejectedExecutionException(); });
        CountDownLatch release = new CountDownLatch(1);
        int accepted = 0;
        for (int i = 0; i < tasks; i++) {
            try { pool.execute(() -> await(release)); accepted++; } catch (RejectedExecutionException ignored) { }
        }
        int queued = pool.getQueue().size();
        int largest = pool.getLargestPoolSize();
        release.countDown();
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
        return new Result(accepted, rejected.get(), largest, queued);
    }

    private static void await(CountDownLatch latch) {
        try { latch.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    public static void main(String[] args) throws Exception { System.out.println(run(20)); }
}
