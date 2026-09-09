<p align="center">
  <img src="assets/HCMUT_Title.png" alt="Ho Chi Minh City University of Technology" width="760">
</p>

# Quang Tran

**Computer Engineering @ Ho Chi Minh City University of Technology (HCMUT)**

`Digital IC Design & Verification · RTL · FPGA · Embedded Systems`

## About

- Computer Engineering student focused on digital hardware, RTL design, and functional verification.
- Hands-on project work with SystemVerilog, UVM, AMBA APB, UART, RISC-V, and FPGA development.
- Built layered and reusable self-checking environments with drivers, monitors, scoreboards/reference models, automated regressions, and functional coverage.
- Extending this hardware foundation through STM32/ESP32 firmware and hardware-software integration.

## Featured Projects

| Project | Engineering highlights |
| --- | --- |
| [UART Verification IP](https://github.com/quang-tran0/ictc-uart-vip) | Reusable UVM VIP validated in a two-agent self-checking environment. Supports active/passive modes, configurable framing and baud rate, error injection, analysis ports, protocol checking, and functional coverage. **Checked-in regression: 41/41 tests passed; project documentation records 51 coverage bins closed.** *SystemVerilog · UVM · UART · QuestaSim* |
| [APB 8-bit Timer Verification](https://github.com/quang-tran0/ICTC-APB-8bit-Timer-Verification) | Layered OOP testbench with stimulus, driver, monitor, and scoreboard/reference model. Verifies APB registers and protocol phases, timer operation, interrupts, clock division, and W1C behavior. **Checked-in results: 56/56 regression tests passed; 61/61 functional-coverage bins reached 100%.** *SystemVerilog · AMBA APB · QuestaSim* |
| [RV32IM Pipelined Datapath](https://github.com/quang-tran0/RISCV32-Pipelined-Datapath) | Pipelined processor datapath with forwarding, load-use stalls, control-flow flushing, and multi-cycle division. An automated testbench runs micro-programs covering arithmetic, logic, branches, jumps, memory access widths, and the M extension. *Verilog · RISC-V RV32IM · Icarus Verilog* |
| [Simple FOTA](https://github.com/quang-tran0/Simple-FOTA) | STM32F103 bootloader and ESP32 gateway for remote firmware delivery. Downloads firmware to SPIFFS, then transfers UART blocks using a 16-bit additive checksum, ACK/NACK retries, flash programming, and application handoff. *C/C++ · STM32 · ESP32 · UART* |

## Currently Building

[**FPGA SD SPI Controller**](https://github.com/quang-tran0/fpga-sd-spi-controller) — **In Progress**. Developing an FPGA SD-card controller over SPI. The parameterized SystemVerilog SPI master and self-checking full-duplex testbench are implemented; the SD controller and reusable UVM environment are still being built.

## Technical Stack

- **RTL & verification:** Verilog, SystemVerilog, UVM, OOP testbenches, scoreboards/reference models, functional coverage
- **Protocols & architecture:** AMBA APB, UART, SPI, I2C, RISC-V RV32IM
- **FPGA & embedded:** FPGA development, STM32, ESP32, C, C++, Python
- **Tools:** QuestaSim, Vivado, Icarus Verilog, Make, Git, Linux

## Contact

- [Email](mailto:quang.trd05@gmail.com)
- [GitHub](https://github.com/quang-tran0)
