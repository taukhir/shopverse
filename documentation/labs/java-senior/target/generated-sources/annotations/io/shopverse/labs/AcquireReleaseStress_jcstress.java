package io.shopverse.labs;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.concurrent.TimeUnit;
import org.openjdk.jcstress.infra.runners.ForkedTestConfig;
import org.openjdk.jcstress.infra.collectors.TestResult;
import org.openjdk.jcstress.infra.runners.Runner;
import org.openjdk.jcstress.infra.runners.WorkerSync;
import org.openjdk.jcstress.util.Counter;
import org.openjdk.jcstress.os.AffinitySupport;
import org.openjdk.jcstress.vm.AllocProfileSupport;
import org.openjdk.jcstress.infra.runners.ResourceEstimator;
import org.openjdk.jcstress.infra.runners.VoidThread;
import org.openjdk.jcstress.infra.runners.LongThread;
import org.openjdk.jcstress.infra.runners.CounterThread;
import io.shopverse.labs.AcquireReleaseStress;
import org.openjdk.jcstress.infra.results.I_Result;

public final class AcquireReleaseStress_jcstress extends Runner<I_Result> {

    volatile WorkerSync workerSync;

    public AcquireReleaseStress_jcstress(ForkedTestConfig config) {
        super(config);
    }

    @Override
    public void sanityCheck(Counter<I_Result> counter) throws Throwable {
        jcstress_sanityCheck_API(counter);
        jcstress_sanityCheck_Resource(counter);
    }

    private static class JcstressThread_APICheck_writer extends VoidThread {
        AcquireReleaseStress t;
        AcquireReleaseStress s;
        I_Result r;

        public JcstressThread_APICheck_writer(AcquireReleaseStress t, AcquireReleaseStress s, I_Result r) {
            super("JcstressThread_APICheck_writer");
            this.t = t;
            this.s = s;
            this.r = r;
        }

        public void internalRun() {
            s.writer();
        };

        public void purge() {
            t = null;
            s = null;
            r = null;
        }
    }

    private static class JcstressThread_APICheck_reader extends VoidThread {
        AcquireReleaseStress t;
        AcquireReleaseStress s;
        I_Result r;

        public JcstressThread_APICheck_reader(AcquireReleaseStress t, AcquireReleaseStress s, I_Result r) {
            super("JcstressThread_APICheck_reader");
            this.t = t;
            this.s = s;
            this.r = r;
        }

        public void internalRun() {
            s.reader(r);
        };

        public void purge() {
            t = null;
            s = null;
            r = null;
        }
    }

    private void jcstress_sanityCheck_API(Counter<I_Result> counter) throws Throwable {
        final AcquireReleaseStress s = new AcquireReleaseStress();
        final I_Result r = new I_Result();
        VoidThread a0 = new JcstressThread_APICheck_writer(null, s, r);
        VoidThread a1 = new JcstressThread_APICheck_reader(null, s, r);
        a0.start();
        a1.start();
        a0.join();
        if (a0.throwable() != null) {
            throw a0.throwable();
        }
        a0.purge();
        a1.join();
        if (a1.throwable() != null) {
            throw a1.throwable();
        }
        a1.purge();
        counter.record(r, 1);
    }

    private static class JcstressThread_ResourceCheck_writer extends LongThread {
        AcquireReleaseStress[] ss;
        I_Result[] rs;
        int size;

        public JcstressThread_ResourceCheck_writer(AcquireReleaseStress[] ss, I_Result[] rs, int size) {
            super("JcstressThread_ResourceCheck_writer");
            this.ss = ss;
            this.rs = rs;
            this.size = size;
        }

        public long internalRun() {
            long a1 = AllocProfileSupport.getAllocatedBytes();
            jcstress_check_writer(ss, rs, size);
            long a2 = AllocProfileSupport.getAllocatedBytes();
            return a2 - a1;
        }

        private void jcstress_check_writer(AcquireReleaseStress[] ls, I_Result[] lr, int size) {
            for (int c = 0; c < size; c++) {
                ls[c].writer();
            }
        }

        public void purge() {
            ss = null;
            rs = null;
        }
    }

    private static class JcstressThread_ResourceCheck_reader extends LongThread {
        AcquireReleaseStress[] ss;
        I_Result[] rs;
        int size;

        public JcstressThread_ResourceCheck_reader(AcquireReleaseStress[] ss, I_Result[] rs, int size) {
            super("JcstressThread_ResourceCheck_reader");
            this.ss = ss;
            this.rs = rs;
            this.size = size;
        }

        public long internalRun() {
            long a1 = AllocProfileSupport.getAllocatedBytes();
            jcstress_check_reader(ss, rs, size);
            long a2 = AllocProfileSupport.getAllocatedBytes();
            return a2 - a1;
        }

        private void jcstress_check_reader(AcquireReleaseStress[] ls, I_Result[] lr, int size) {
            for (int c = 0; c < size; c++) {
                ls[c].reader(lr[c]);
            }
        }

        public void purge() {
            ss = null;
            rs = null;
        }
    }

    private static class TestResourceEstimator implements ResourceEstimator {
        final Counter<I_Result> counter;

        public TestResourceEstimator(Counter<I_Result> counter) {
            this.counter = counter;
        }

        public void runWith(int size, long[] cnts) {
            long time1 = System.nanoTime();
            long alloc1 = AllocProfileSupport.getAllocatedBytes();
            AcquireReleaseStress[] ls = new AcquireReleaseStress[size];
            I_Result[] lr = new I_Result[size];
            for (int c = 0; c < size; c++) {
                AcquireReleaseStress s = new AcquireReleaseStress();
                I_Result r = new I_Result();
                lr[c] = r;
                ls[c] = s;
            }
            LongThread a0 = new JcstressThread_ResourceCheck_writer(ls, lr, size);
            LongThread a1 = new JcstressThread_ResourceCheck_reader(ls, lr, size);
            a0.start();
            a1.start();
            try {
                a0.join();
                cnts[0] += a0.result();
                a0.purge();
            } catch (InterruptedException e) {
            }
            try {
                a1.join();
                cnts[0] += a1.result();
                a1.purge();
            } catch (InterruptedException e) {
            }
            for (int c = 0; c < size; c++) {
                counter.record(lr[c], 1);
            }
            long time2 = System.nanoTime();
            long alloc2 = AllocProfileSupport.getAllocatedBytes();
            cnts[0] += alloc2 - alloc1;
            cnts[1] += time2 - time1;
        }
    }

    private void jcstress_sanityCheck_Resource(Counter<I_Result> counter) throws Throwable {
        config.adjustStrideCount(new TestResourceEstimator(counter));
    }

    @Override
    public ArrayList<CounterThread<I_Result>> internalRun() {
        int len = config.strideSize * config.strideCount;
        AcquireReleaseStress[] ls = new AcquireReleaseStress[len];
        I_Result[] lr = new I_Result[len];
        for (int c = 0; c < len; c++) {
            ls[c] = new AcquireReleaseStress();
            lr[c] = new I_Result();
        }
        workerSync = new WorkerSync(false, 2, config.spinLoopStyle);

        control.stopping = false;

        if (config.localAffinity) {
            try {
                AffinitySupport.tryBind();
            } catch (Exception e) {
                // Do not care
            }
        }

        ArrayList<CounterThread<I_Result>> threads = new ArrayList<>(2);
        threads.add(new JcstressThread_writer(ls, lr, null));
        threads.add(new JcstressThread_reader(ls, lr, null));

        for (CounterThread<I_Result> t : threads) {
            t.start();
        }

        if (config.time > 0) {
            try {
                TimeUnit.MILLISECONDS.sleep(config.time);
            } catch (InterruptedException e) {
            }
        }

        control.stopping = true;

        return threads;
    }

    public static void jcstress_ni_consume_final(Counter<I_Result> cnt, AcquireReleaseStress[] ls, I_Result[] lr, AcquireReleaseStress test, int len, int a) {
        int left = a * len / 2;
        int right = (a + 1) * len / 2;
        for (int c = left; c < right; c++) {
            I_Result r = lr[c];
            AcquireReleaseStress s = ls[c];
            cnt.record(r, 1);
        }
    }

    public static void jcstress_consume_reinit(Counter<I_Result> cnt, AcquireReleaseStress[] ls, I_Result[] lr, AcquireReleaseStress test, int len, int a) {
        int left = a * len / 2;
        int right = (a + 1) * len / 2;
        for (int c = left; c < right; c++) {
            I_Result r = lr[c];
            AcquireReleaseStress s = ls[c];
            s.data = 0;
            s.ready = 0;
            cnt.record(r, 1);
            r.r1 = 0;
        }
    }

    public class JcstressThread_writer extends CounterThread<I_Result> {
        AcquireReleaseStress[] ss;
        I_Result[] rs;
        AcquireReleaseStress test;

        public JcstressThread_writer(AcquireReleaseStress[] ss, I_Result[] rs, AcquireReleaseStress test) {
            super("JcstressThread_writer");
            this.ss = ss;
            this.rs = rs;
            this.test = test;
        }

        public Counter<I_Result> internalRun() {
            return jcstress_iteration_writer();
        }

        private Counter<I_Result> jcstress_iteration_writer() {
            int len = config.strideSize * config.strideCount;
            int stride = config.strideSize;
            Counter<I_Result> counter = new Counter<>();
            if (config.localAffinity) AffinitySupport.bind(config.localAffinityMap[0]);
            while (true) {
                WorkerSync sync = workerSync;
                int check = 0;
                for (int start = 0; start < len; start += stride) {
                    jcstress_stride_writer(start, start + stride);
                    check += 2;
                    sync.awaitCheckpoint(check);
                }
                if (sync.stopping) {
                    jcstress_ni_consume_final(counter, ss, rs, null, len, 0);
                    return counter;
                } else {
                    jcstress_consume_reinit(counter, ss, rs, null, len, 0);
                }
                if (sync.tryStartUpdate()) {
                    workerSync = new WorkerSync(control.stopping, 2, config.spinLoopStyle);
                }
                sync.postUpdate();
            }
        }

        private void jcstress_stride_writer(int start, int end) {
            AcquireReleaseStress[] ls = ss;
            I_Result[] lr = rs;
            for (int c = start; c < end; c++) {
                AcquireReleaseStress s = ls[c];
                s.writer();
            }
        }

        public void purge() {
            ss = null;
            rs = null;
            test = null;
        }
    }

    public class JcstressThread_reader extends CounterThread<I_Result> {
        AcquireReleaseStress[] ss;
        I_Result[] rs;
        AcquireReleaseStress test;

        public JcstressThread_reader(AcquireReleaseStress[] ss, I_Result[] rs, AcquireReleaseStress test) {
            super("JcstressThread_reader");
            this.ss = ss;
            this.rs = rs;
            this.test = test;
        }

        public Counter<I_Result> internalRun() {
            return jcstress_iteration_reader();
        }

        private Counter<I_Result> jcstress_iteration_reader() {
            int len = config.strideSize * config.strideCount;
            int stride = config.strideSize;
            Counter<I_Result> counter = new Counter<>();
            if (config.localAffinity) AffinitySupport.bind(config.localAffinityMap[1]);
            while (true) {
                WorkerSync sync = workerSync;
                int check = 0;
                for (int start = 0; start < len; start += stride) {
                    jcstress_stride_reader(start, start + stride);
                    check += 2;
                    sync.awaitCheckpoint(check);
                }
                if (sync.stopping) {
                    jcstress_ni_consume_final(counter, ss, rs, null, len, 1);
                    return counter;
                } else {
                    jcstress_consume_reinit(counter, ss, rs, null, len, 1);
                }
                if (sync.tryStartUpdate()) {
                    workerSync = new WorkerSync(control.stopping, 2, config.spinLoopStyle);
                }
                sync.postUpdate();
            }
        }

        private void jcstress_stride_reader(int start, int end) {
            AcquireReleaseStress[] ls = ss;
            I_Result[] lr = rs;
            for (int c = start; c < end; c++) {
                AcquireReleaseStress s = ls[c];
                I_Result r = lr[c];
                int trap_r = r.jcstress_trap;
                s.reader(r);
            }
        }

        public void purge() {
            ss = null;
            rs = null;
            test = null;
        }
    }

}
