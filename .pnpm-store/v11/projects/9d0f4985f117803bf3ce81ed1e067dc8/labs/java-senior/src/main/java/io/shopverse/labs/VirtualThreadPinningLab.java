package io.shopverse.labs;

import java.util.concurrent.CountDownLatch;

public final class VirtualThreadPinningLab {
    private static final Object MONITOR = new Object();

    public static void main(String[] args) throws Exception {
        CountDownLatch entered = new CountDownLatch(1);
        Thread virtual = Thread.ofVirtual().name("pinning-demo").start(() -> {
            synchronized (MONITOR) {
                entered.countDown();
                try { Thread.sleep(250); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
        });
        entered.await();
        virtual.join();
        System.out.println("Inspect JFR/trace output for the behavior of your exact JDK; monitor pinning rules evolve.");
    }
}
